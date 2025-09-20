import { preferences } from './preferences.svelte';

export type TimerPhase = 'idle' | 'focus' | 'break';

class TimerStore {
	phase = $state<TimerPhase>('idle');
	startedAt = $state<number | null>(null);
	baseElapsedSec = $state(0);
	now = $state(Date.now());

	// Progress tracking
	sessionsCompleted = $state(0);
	totalFocusTime = $state(0);
	breaksCompleted = $state(0);
	totalBreakTime = $state(0);

	private interval: ReturnType<typeof setInterval> | undefined;

	// Derived values using $derived for efficiency
	currentDuration = $derived.by(() => {
		if (this.phase === 'focus') return Math.max(1, Math.round(preferences.focusMinutes * 60));
		if (this.phase === 'break') return Math.max(1, Math.round(preferences.breakMinutes * 60));
		return 0;
	});

	elapsed = $derived(
		(this.startedAt ? Math.floor((this.now - this.startedAt) / 1000) : 0) + this.baseElapsedSec
	);

	remaining = $derived(Math.max(this.currentDuration - this.elapsed, 0));

	running = $derived(this.startedAt !== null && this.remaining > 0);

	isComplete = $derived(this.startedAt !== null && this.remaining === 0);

	// Display helpers
	timeLabel = $derived.by(() => {
		const secs = this.phase === 'idle' ? this.currentDuration : this.remaining;
		const mins = Math.floor(secs / 60);
		const s = secs % 60;
		return `${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
	});

	phaseLabel = $derived.by(() => {
		if (this.phase === 'idle') return 'Ready to focus';
		if (this.phase === 'focus') return this.running ? 'Focusing...' : 'Paused';
		return this.running ? 'On break' : 'Break paused';
	});

	// Progress ring calculation
	progress = $derived.by(() => {
		if (this.phase === 'idle') return 0;
		return this.currentDuration > 0 ? (this.currentDuration - this.remaining) / this.currentDuration : 0;
	});

	// geometry for SVG ring
	readonly r = 45;
	readonly C = 2 * Math.PI * this.r;

	dashOffset = $derived(this.C * (1 - this.progress));

	constructor() {
		// Auto-complete timer when time runs out
		$effect(() => {
			if (!this.isComplete) return;

			if (this.phase === 'focus') {
				this.sessionsCompleted++;
				this.totalFocusTime += Math.floor(this.currentDuration / 60);
				this.startBreak();
			} else if (this.phase === 'break') {
				this.breaksCompleted++;
				this.totalBreakTime += Math.floor(this.currentDuration / 60);
				this.reset();
			}
		});

		// Timer interval management
		$effect(() => {
			if (!this.running) {
				this.stopInterval();
				return;
			}

			this.startInterval();
			return () => this.stopInterval();
		});
	}

	private startInterval() {
		this.stopInterval();
		this.interval = setInterval(() => {
			this.now = Date.now();
		}, 250);
	}

	private stopInterval() {
		if (this.interval) {
			clearInterval(this.interval);
			this.interval = undefined;
		}
	}

	startFocus() {
		this.phase = 'focus';
		this.baseElapsedSec = 0;
		this.startedAt = Date.now();
		this.now = this.startedAt;
	}

	startBreak() {
		this.phase = 'break';
		this.baseElapsedSec = 0;
		this.startedAt = Date.now();
		this.now = this.startedAt;
	}

	pause() {
		if (!this.startedAt) return;
		this.baseElapsedSec = this.elapsed;
		this.startedAt = null;
	}

	resume() {
		if (this.startedAt || this.phase === 'idle') return;
		this.startedAt = Date.now();
		this.now = this.startedAt;
	}

	reset() {
		this.phase = 'idle';
		this.startedAt = null;
		this.baseElapsedSec = 0;
	}

	endBreakEarly() {
		if (this.phase !== 'break') return;
		this.breaksCompleted++;
		this.totalBreakTime += Math.floor(this.elapsed / 60);
		this.reset();
	}

	resetProgress() {
		this.sessionsCompleted = 0;
		this.totalFocusTime = 0;
		this.breaksCompleted = 0;
		this.totalBreakTime = 0;
	}
}

export const timer = new TimerStore();