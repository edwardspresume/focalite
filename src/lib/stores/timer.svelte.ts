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

	constructor() {}

	private startInterval() {
		this.stopInterval();
		this.interval = setInterval(() => this.onTick(), 250);
	}

	private stopInterval() {
		if (this.interval) {
			clearInterval(this.interval);
			this.interval = undefined;
		}
	}

	private onTick() {
		this.now = Date.now();
		// Handle completion immediately when remaining reaches zero
		if (this.startedAt && this.remaining <= 0) {
			this.onComplete();
		}
	}

	private onComplete() {
		// Ensure we don't keep ticking in this phase
		this.stopInterval();
		if (this.phase === 'focus') {
			this.sessionsCompleted++;
			this.totalFocusTime += Math.floor(this.currentDuration / 60);
			this.startBreak();
		} else if (this.phase === 'break') {
			this.breaksCompleted++;
			this.totalBreakTime += Math.floor(this.currentDuration / 60);
			this.reset();
		}
	}

	startFocus() {
		this.phase = 'focus';
		this.baseElapsedSec = 0;
		this.startedAt = Date.now();
		this.now = this.startedAt;
		this.startInterval();
	}

	startBreak() {
		this.phase = 'break';
		this.baseElapsedSec = 0;
		this.startedAt = Date.now();
		this.now = this.startedAt;
		this.startInterval();
	}

	pause() {
		if (!this.startedAt) return;
		this.baseElapsedSec = this.elapsed;
		this.startedAt = null;
		this.stopInterval();
	}

	resume() {
		if (this.startedAt || this.phase === 'idle') return;
		this.startedAt = Date.now();
		this.now = this.startedAt;
		this.startInterval();
	}

	reset() {
		this.phase = 'idle';
		this.startedAt = null;
		this.baseElapsedSec = 0;
		this.stopInterval();
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
