import { LazyStore } from '@tauri-apps/plugin-store';
import { SvelteDate } from 'svelte/reactivity';
import {
	getLocalDateString,
	IntervalManager,
	Throttle,
	validateNumber,
	withErrorHandling
} from './store-utils';
import { timer } from './timer.svelte';

export interface DailyProgress {
	date: string; // YYYY-MM-DD
	sessionsCompleted: number;
	breaksCompleted: number;
	focusMinutes: number;
	breakMinutes: number;
}

interface DailyWindowOptions {
	includeToday?: boolean;
	fillMissing?: boolean;
}

class ProgressStore {
	private store = new LazyStore('progress.json', { defaults: {} });
	private intervalManager = new IntervalManager();
	private saveThrottle = new Throttle();

	currentDate = $state(getLocalDateString(new Date()));
	loaded = $state(false);
	private lastPersistedCompletionAt = $state<number | null>(null);

	// Derived state from timer - read-only view of current progress
	currentProgress = $derived.by(
		(): DailyProgress => ({
			date: this.currentDate,
			sessionsCompleted: timer.sessionsCompleted,
			breaksCompleted: timer.breaksCompleted,
			focusMinutes: timer.totalFocusTime,
			breakMinutes: timer.totalBreakTime
		})
	);

	constructor() {
		this.initialize();
	}

	private async initialize() {
		await this.loadTodayProgress();
		this.intervalManager.start(() => this.onTick(), 1000);
	}

	private async loadTodayProgress() {
		const today = getLocalDateString(new Date());
		const progress = await withErrorHandling(
			() => this.store.get(today) as Promise<DailyProgress | null>,
			"Failed to load today's progress",
			null
		);

		if (progress) {
			// Load persisted progress into timer state
			timer.sessionsCompleted = validateNumber(progress.sessionsCompleted, 0);
			timer.breaksCompleted = validateNumber(progress.breaksCompleted, 0);
			timer.totalFocusTime = validateNumber(progress.focusMinutes, 0);
			timer.totalBreakTime = validateNumber(progress.breakMinutes, 0);
		} else {
			// Reset timer state for new day
			this.resetTimerState();
		}

		this.currentDate = today;
		this.loaded = true;
		this.lastPersistedCompletionAt = timer.lastCompletionAt;
	}

	private onTick() {
		if (!this.loaded) return;

		const today = getLocalDateString(new Date());
		if (this.currentDate !== today) {
			this.handleNewDay(today);
			return;
		}

		// Auto-save during active sessions (throttled)
		if (timer.running) {
			this.saveThrottle.execute(() => this.saveProgress(), 15000);
		}

		// Immediate save on completion events
		if (timer.lastCompletionAt !== this.lastPersistedCompletionAt) {
			void this.saveProgress();
		}
	}

	private handleNewDay(newDate: string) {
		this.currentDate = newDate;
		this.resetTimerState();
		this.saveThrottle.clear();
		void this.saveProgress();
	}

	private resetTimerState() {
		timer.sessionsCompleted = 0;
		timer.breaksCompleted = 0;
		timer.totalFocusTime = 0;
		timer.totalBreakTime = 0;
	}

	private async saveProgress() {
		await withErrorHandling(
			async () => {
				await this.store.set(this.currentDate, this.currentProgress);
				this.lastPersistedCompletionAt = timer.lastCompletionAt;
			},
			'Failed to save progress',
			undefined
		);
	}

	// --- Public API ---
	async getHistoricalProgress(days: number = 30): Promise<DailyProgress[]> {
		return withErrorHandling(
			async () => {
				const results: DailyProgress[] = [];
				const today = new SvelteDate();

				for (let i = 0; i < days; i++) {
					const date = new SvelteDate(today);
					date.setDate(date.getDate() - i);
					const dateStr = getLocalDateString(date);

					const progress = (await this.store.get(dateStr)) as DailyProgress | null;
					if (progress) {
						results.push({
							date: progress.date || dateStr,
							sessionsCompleted: validateNumber(progress.sessionsCompleted, 0),
							breaksCompleted: validateNumber(progress.breaksCompleted, 0),
							focusMinutes: validateNumber(progress.focusMinutes, 0),
							breakMinutes: validateNumber(progress.breakMinutes, 0)
						});
					}
				}

			return results.reverse(); // Oldest first
			},
			'Failed to get historical progress',
			[]
		);
	}

	async getDailyWindow(
		days: number = 30,
		{ includeToday = true, fillMissing = true }: DailyWindowOptions = {}
	): Promise<DailyProgress[]> {
		return withErrorHandling(
			async () => {
				const history = await this.getHistoricalProgress(days);
				const historyByDate = new Map(history.map((entry) => [entry.date, entry]));
				const today = new SvelteDate();
				const start = new SvelteDate(today);
				start.setDate(start.getDate() - (days - 1));

				const window: DailyProgress[] = [];

				for (let offset = 0; offset < days; offset++) {
					const date = new SvelteDate(start);
					date.setDate(start.getDate() + offset);
					const dateStr = getLocalDateString(date);
					const persisted = historyByDate.get(dateStr);
					const isToday = dateStr === this.currentDate;

					let entry: DailyProgress | null = null;

					if (includeToday && isToday) {
						entry = {
							date: dateStr,
							sessionsCompleted: timer.sessionsCompleted,
							breaksCompleted: timer.breaksCompleted,
							focusMinutes: timer.totalFocusTime,
							breakMinutes: timer.totalBreakTime
						};
					} else if (persisted) {
						entry = persisted;
					} else if (fillMissing) {
						entry = {
							date: dateStr,
							sessionsCompleted: 0,
							breaksCompleted: 0,
							focusMinutes: 0,
							breakMinutes: 0
						};
					}

					if (entry) {
						window.push({
							date: entry.date,
							sessionsCompleted: validateNumber(entry.sessionsCompleted, 0),
							breaksCompleted: validateNumber(entry.breaksCompleted, 0),
							focusMinutes: validateNumber(entry.focusMinutes, 0),
							breakMinutes: validateNumber(entry.breakMinutes, 0)
						});
					}
				}

				return window;
			},
			'Failed to build daily progress window',
			[]
		);
	}
}

export const progress = new ProgressStore();
