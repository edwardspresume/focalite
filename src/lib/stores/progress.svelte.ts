import { timer } from './timer.svelte';
import { createStoreAccessor } from './kv-store';

export interface DailyProgress {
	date: string; // YYYY-MM-DD
	sessionsCompleted: number;
	breaksCompleted: number;
	focusMinutes: number;
	breakMinutes: number;
}

const getStore = createStoreAccessor('progress.json');
let saveThrottleId: ReturnType<typeof setTimeout> | null = null;

function getLocalDateString(date: Date): string {
	return date.toISOString().split('T')[0];
}

class ProgressStore {
  date = $state(getLocalDateString(new Date()));
  loaded = $state(false);
  private interval: ReturnType<typeof setInterval> | null = null;
  private lastPersistedCompletionAt = $state<number | null>(null);

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
			this.lastPersistedCompletionAt = timer.lastCompletionAt;
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

		// Immediate save once per completion event
		const completionAt = timer.lastCompletionAt;
		if (completionAt && completionAt !== this.lastPersistedCompletionAt) {
			void this.saveProgressImmediate();
		}
	}

	private resetForNewDay(newDate: string) {
		this.date = newDate;
		timer.sessionsCompleted = 0;
		timer.breaksCompleted = 0;
		timer.totalFocusTime = 0;
		timer.totalBreakTime = 0;
		if (saveThrottleId) {
			clearTimeout(saveThrottleId);
			saveThrottleId = null;
		}
		void this.saveProgressImmediate();
		this.lastPersistedCompletionAt = timer.lastCompletionAt;
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
			this.lastPersistedCompletionAt = timer.lastCompletionAt;
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
