import { timer } from './timer.svelte';
import { LazyStore } from '@tauri-apps/plugin-store';
import { SvelteDate } from 'svelte/reactivity';

export interface DailyProgress {
	date: string; // YYYY-MM-DD
	sessionsCompleted: number;
	breaksCompleted: number;
	focusMinutes: number;
	breakMinutes: number;
}

const DEFAULT_PROGRESS: Omit<DailyProgress, 'date'> = {
	sessionsCompleted: 0,
	breaksCompleted: 0,
	focusMinutes: 0,
	breakMinutes: 0
};

function getLocalDateString(date: Date): string {
	return date.toISOString().split('T')[0];
}

class ProgressStore {
	private store = new LazyStore('progress.json', {
		defaults: {}
	});

	date = $state(getLocalDateString(new Date()));
	loaded = $state(false);
	private interval: ReturnType<typeof setInterval> | null = null;
	private lastPersistedCompletionAt = $state<number | null>(null);
	private saveThrottleId: ReturnType<typeof setTimeout> | null = null;

	constructor() {
		this.loadTodayProgress();
		this.startWatcher();
	}

	private async loadTodayProgress() {
		try {
			const today = getLocalDateString(new Date());
			const progress = await this.store.get(today) as DailyProgress | null;

			if (progress) {
				// Validate progress data and apply defaults for missing fields
				timer.sessionsCompleted = this.validateNumber(progress.sessionsCompleted, DEFAULT_PROGRESS.sessionsCompleted);
				timer.breaksCompleted = this.validateNumber(progress.breaksCompleted, DEFAULT_PROGRESS.breaksCompleted);
				timer.totalFocusTime = this.validateNumber(progress.focusMinutes, DEFAULT_PROGRESS.focusMinutes);
				timer.totalBreakTime = this.validateNumber(progress.breakMinutes, DEFAULT_PROGRESS.breakMinutes);
			} else {
				// Apply defaults for new day
				timer.sessionsCompleted = DEFAULT_PROGRESS.sessionsCompleted;
				timer.breaksCompleted = DEFAULT_PROGRESS.breaksCompleted;
				timer.totalFocusTime = DEFAULT_PROGRESS.focusMinutes;
				timer.totalBreakTime = DEFAULT_PROGRESS.breakMinutes;
			}

			this.date = today;
			this.loaded = true;
			this.lastPersistedCompletionAt = timer.lastCompletionAt;
		} catch (error) {
			console.error('Failed to load today\'s progress:', error);
			// Graceful degradation - set defaults and mark as loaded
			this.date = getLocalDateString(new Date());
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
		timer.sessionsCompleted = DEFAULT_PROGRESS.sessionsCompleted;
		timer.breaksCompleted = DEFAULT_PROGRESS.breaksCompleted;
		timer.totalFocusTime = DEFAULT_PROGRESS.focusMinutes;
		timer.totalBreakTime = DEFAULT_PROGRESS.breakMinutes;
		this.clearSaveThrottle();
		void this.saveProgressImmediate();
		this.lastPersistedCompletionAt = timer.lastCompletionAt;
	}

	private saveProgressThrottled() {
		if (this.saveThrottleId) return;

		this.saveThrottleId = setTimeout(() => {
			void this.saveProgressImmediate();
			this.saveThrottleId = null;
		}, 15000); // Save every 15 seconds during active sessions
	}

	private async saveProgressImmediate() {
		try {
			const progress: DailyProgress = {
				date: this.date,
				sessionsCompleted: timer.sessionsCompleted,
				breaksCompleted: timer.breaksCompleted,
				focusMinutes: timer.totalFocusTime,
				breakMinutes: timer.totalBreakTime
			};

			await this.store.set(this.date, progress);
			this.lastPersistedCompletionAt = timer.lastCompletionAt;
		} catch (error) {
			console.error('Failed to save progress:', error);
		}
	}

	// --- Validation helpers ---
	private validateNumber(value: unknown, defaultValue: number): number {
		return typeof value === 'number' && !isNaN(value) && value >= 0 ? value : defaultValue;
	}

	private clearSaveThrottle() {
		if (this.saveThrottleId) {
			clearTimeout(this.saveThrottleId);
			this.saveThrottleId = null;
		}
	}

	// --- Public API ---
	// Get historical progress data
	async getHistoricalProgress(days: number = 30): Promise<DailyProgress[]> {
		try {
			const results: DailyProgress[] = [];
			const today = new SvelteDate();

			for (let i = 0; i < days; i++) {
				const date = new SvelteDate(today);
				date.setDate(date.getDate() - i);
				const dateStr = getLocalDateString(date);

				const progress = await this.store.get(dateStr) as DailyProgress | null;
				if (progress) {
					// Validate historical data
					const validatedProgress: DailyProgress = {
						date: progress.date || dateStr,
						sessionsCompleted: this.validateNumber(progress.sessionsCompleted, 0),
						breaksCompleted: this.validateNumber(progress.breaksCompleted, 0),
						focusMinutes: this.validateNumber(progress.focusMinutes, 0),
						breakMinutes: this.validateNumber(progress.breakMinutes, 0)
					};
					results.push(validatedProgress);
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