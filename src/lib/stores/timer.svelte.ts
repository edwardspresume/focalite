import { preferences } from './preferences.svelte';

export type TimerPhase = 'idle' | 'focus' | 'break';

// Small utility to format seconds as MM:SS for labels
function formatTime(secs: number): string {
	const total = Math.max(0, Math.floor(secs));
	const mins = Math.floor(total / 60);
	const s = total % 60;
	return `${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

class TimerStore {
	phase = $state<TimerPhase>('idle');
	startedAt = $state<number | null>(null);
	baseElapsedSec = $state(0);
	now = $state(Date.now());

	// Lock duration when session starts to prevent mid-session changes
	private lockedDuration = $state<number | null>(null);

	// Progress tracking
	sessionsCompleted = $state(0);
	totalFocusTime = $state(0);
	breaksCompleted = $state(0);
	totalBreakTime = $state(0);
	lastCompletedPhase = $state<TimerPhase | null>(null);
	lastCompletionAt = $state<number | null>(null);
	isManualCycle = $state(false);

	private interval: ReturnType<typeof setInterval> | undefined;

	// Helper method for duration calculations
	private getDurationForPhase(phase: TimerPhase): number {
		const minutes = phase === 'focus' ? preferences.focusMinutes : preferences.breakMinutes;
		return Math.max(1, Math.round(minutes * 60));
	}

	// Derived values using $derived for efficiency
	// Note: When idle, this returns 0 intentionally. Idle display is handled
	// by focusDurationLabel/breakDurationLabel in the UI; currentDuration is
	// the source for active/paused session math (remaining, progress, crediting).
	currentDuration = $derived.by(() => {
		// Use locked duration if set (during active session)
		if (this.lockedDuration !== null) return this.lockedDuration;

		// Otherwise use current preferences for the active phase
		if (this.phase === 'focus' || this.phase === 'break') {
			return this.getDurationForPhase(this.phase);
		}

		return 0;
	});

	elapsed = $derived(
		(this.startedAt ? Math.floor((this.now - this.startedAt) / 1000) : 0) + this.baseElapsedSec
	);

	remaining = $derived(Math.max(this.currentDuration - this.elapsed, 0));

	running = $derived(this.startedAt !== null && this.remaining > 0);

	isComplete = $derived(this.startedAt !== null && this.remaining === 0);

	// Display helpers
	displaySeconds = $derived(this.phase === 'idle' ? this.currentDuration : this.remaining);

	// Always show break duration (use locked duration during active break)
	breakDurationSeconds = $derived.by(() =>
		this.phase === 'break' && this.lockedDuration !== null
			? this.lockedDuration
			: this.getDurationForPhase('break')
	);

	timeLabel = $derived.by(() => formatTime(this.displaySeconds));

	breakDurationLabel = $derived.by(() => formatTime(this.breakDurationSeconds));

	// Focus duration (only used when idle, so always show current preference)
	focusDurationSeconds = $derived(this.getDurationForPhase('focus'));

	focusDurationLabel = $derived.by(() => formatTime(this.focusDurationSeconds));

	phaseLabel = $derived.by(() => {
		if (this.phase === 'idle') return 'Ready to focus';
		if (this.phase === 'focus') return this.running ? 'Focusing...' : 'Paused';
		return this.running ? 'On break' : 'Break paused';
	});

	// Progress ring calculation
	progress = $derived.by(() => {
		if (this.phase === 'idle') return 0;
		return this.currentDuration > 0
			? (this.currentDuration - this.remaining) / this.currentDuration
			: 0;
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
		const completedPhase = this.phase;
		const completedMinutes = Math.floor((this.lockedDuration ?? 0) / 60);
		this.lastCompletedPhase = completedPhase;
		this.lastCompletionAt = Date.now();

		if (completedPhase === 'focus') {
			this.sessionsCompleted++;
			this.totalFocusTime += completedMinutes;
			this.startBreak();
		} else if (completedPhase === 'break') {
			this.breaksCompleted++;
			this.totalBreakTime += completedMinutes;
			// If it's a manual cycle, don't auto-start focus even with auto-loop enabled
			if (preferences.autoLoop && !this.isManualCycle) {
				this.startFocus();
			} else {
				this.reset();
			}
		}
	}

	startFocus() {
		this.phase = 'focus';
		this.lockedDuration = this.getDurationForPhase('focus');
		this.baseElapsedSec = 0;
		this.startedAt = Date.now();
		this.now = this.startedAt;
		this.startInterval();
	}

	startBreak() {
		this.phase = 'break';
		this.lockedDuration = this.getDurationForPhase('break');
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
		this.lockedDuration = null;
		this.isManualCycle = false;
		this.stopInterval();
	}

	endBreakEarly() {
		if (this.phase !== 'break') return;
		this.breaksCompleted++;
		this.totalBreakTime += Math.floor(this.elapsed / 60);
		this.reset();
	}

	startManualBreak() {
		if (this.phase === 'focus') {
			// Stop focus immediately and start break
			this.stopInterval(); // Stop the current timer first
			this.sessionsCompleted++;
			this.totalFocusTime += Math.floor(this.elapsed / 60);
			this.lastCompletedPhase = 'focus';
			this.lastCompletionAt = Date.now();
		} else if (this.phase === 'break') {
			// Already in break, no-op
			return;
		}
		// Mark as manual cycle and start break
		this.isManualCycle = true;
		this.startBreak();
	}
}

export const timer = new TimerStore();
