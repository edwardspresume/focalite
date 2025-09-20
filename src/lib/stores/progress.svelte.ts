import { load } from '@tauri-apps/plugin-store';
import { timer } from './timer.svelte';

export interface DailyProgress {
	date: string; // YYYY-MM-DD
	sessionsCompleted: number;
	breaksCompleted: number;
	focusMinutes: number;
	breakMinutes: number;
}

// Minimal key/value store interface we rely on
interface KVStore {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T): Promise<void>;
  save(): Promise<void>;
}

let store: KVStore | null = null;
let saveThrottleId: ReturnType<typeof setTimeout> | null = null;

function isTauri(): boolean {
  return typeof window !== 'undefined' && !!(window as any).__TAURI__;
}

class WebLocalStore implements KVStore {
  private ns: string;
  private cache: Record<string, unknown>;

  constructor(filename: string) {
    this.ns = `focalite:${filename}`;
    try {
      const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(this.ns) : null;
      this.cache = raw ? JSON.parse(raw) : {};
    } catch {
      this.cache = {};
    }
  }

  async get<T>(key: string): Promise<T | undefined> {
    return this.cache[key] as T | undefined;
  }

  async set<T>(key: string, value: T): Promise<void> {
    this.cache[key] = value as unknown;
  }

  async save(): Promise<void> {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(this.ns, JSON.stringify(this.cache));
      }
    } catch {
      // noop
    }
  }
}

async function getStore(): Promise<KVStore> {
  if (!store) {
    try {
      if (isTauri()) {
        store = await load('progress.json');
      } else {
        store = new WebLocalStore('progress.json');
      }
    } catch (error) {
      console.error('Failed to load progress store:', error);
      store = new WebLocalStore('progress.json');
    }
  }
  return store;
}

function getLocalDateString(date: Date): string {
	return date.toISOString().split('T')[0];
}

class ProgressStore {
  date = $state(getLocalDateString(new Date()));
  loaded = $state(false);
  private interval: ReturnType<typeof setInterval> | null = null;
  private completionHandled = false;

  constructor() {
    this.loadTodayProgress();
		this.startWatcher();
  }

	private async loadTodayProgress() {
		try {
			const store = await getStore();
			const today = getLocalDateString(new Date());

			const progress = await store.get<DailyProgress>(today);
			if (progress) {
				timer.sessionsCompleted = progress.sessionsCompleted;
				timer.breaksCompleted = progress.breaksCompleted;
				timer.totalFocusTime = progress.focusMinutes;
				timer.totalBreakTime = progress.breakMinutes;
			}

			this.date = today;
			this.loaded = true;
		} catch (error) {
			console.error('Failed to load today\'s progress:', error);
			this.loaded = true;
		}
	}

	private startWatcher() {
		this.stopWatcher();
		this.interval = setInterval(() => this.onTick(), 1000);
	}

	private stopWatcher() {
		if (this.interval) {
			clearInterval(this.interval);
			this.interval = null;
		}
	}

	private onTick() {
		if (!this.loaded) return;

		// Midnight rollover check (uses ISO date string)
		const today = getLocalDateString(new Date());
		if (this.date !== today) {
			this.resetForNewDay(today);
			return;
		}

		// Throttled save during active sessions
		if (timer.running) {
			this.saveProgressThrottled();
		}

		// Immediate save once upon session completion
		if (timer.isComplete && !this.completionHandled) {
			this.completionHandled = true;
			this.saveProgressImmediate();
		} else if (!timer.isComplete) {
			this.completionHandled = false;
		}
	}

	private resetForNewDay(newDate: string) {
		this.date = newDate;
		timer.sessionsCompleted = 0;
		timer.breaksCompleted = 0;
		timer.totalFocusTime = 0;
		timer.totalBreakTime = 0;
		this.saveProgressImmediate();
	}

	private saveProgressThrottled() {
		if (saveThrottleId) return;

		saveThrottleId = setTimeout(() => {
			this.saveProgressImmediate();
			saveThrottleId = null;
		}, 15000); // Save every 15 seconds during active sessions
	}

	private async saveProgressImmediate() {
		try {
			const store = await getStore();
			const progress: DailyProgress = {
				date: this.date,
				sessionsCompleted: timer.sessionsCompleted,
				breaksCompleted: timer.breaksCompleted,
				focusMinutes: timer.totalFocusTime,
				breakMinutes: timer.totalBreakTime
			};

			await store.set(this.date, progress);
			await store.save();
		} catch (error) {
			console.error('Failed to save progress:', error);
		}
	}

	async resetProgress() {
		try {
			timer.resetProgress();
			await this.saveProgressImmediate();
		} catch (error) {
			console.error('Failed to reset progress:', error);
		}
	}

	// Get historical progress data
	async getHistoricalProgress(days: number = 30): Promise<DailyProgress[]> {
		try {
			const store = await getStore();
			const results: DailyProgress[] = [];
			const today = new Date();

			for (let i = 0; i < days; i++) {
				const date = new Date(today);
				date.setDate(date.getDate() - i);
				const dateStr = getLocalDateString(date);

				const progress = await store.get<DailyProgress>(dateStr);
				if (progress) {
					results.push(progress);
				}
			}

			return results.reverse(); // Oldest first
		} catch (error) {
			console.error('Failed to get historical progress:', error);
			return [];
		}
	}
}

export const progress = new ProgressStore();
