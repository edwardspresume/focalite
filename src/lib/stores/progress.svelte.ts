import { load, type Store } from '@tauri-apps/plugin-store';
import { timer } from './timer.svelte';

export interface DailyProgress {
	date: string; // YYYY-MM-DD
	sessionsCompleted: number;
	breaksCompleted: number;
	focusMinutes: number;
	breakMinutes: number;
}

let store: Store | null = null;
let saveThrottleId: ReturnType<typeof setTimeout> | null = null;

async function getStore(): Promise<Store> {
	if (!store) {
		try {
			store = await load('progress.json');
		} catch (error) {
			console.error('Failed to load progress store:', error);
			throw error;
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

	constructor() {
		this.loadTodayProgress();
		this.watchTimerProgress();
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

	private watchTimerProgress() {
		// Save progress when sessions complete
		$effect(() => {
			if (!this.loaded) return;

			// Check for midnight rollover
			const today = getLocalDateString(new Date());
			if (this.date !== today) {
				this.resetForNewDay(today);
				return;
			}

			// Throttled save during active sessions
			if (timer.running) {
				this.saveProgressThrottled();
			}

			// Immediate save on session completion
			if (timer.isComplete) {
				this.saveProgressImmediate();
			}
		});
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