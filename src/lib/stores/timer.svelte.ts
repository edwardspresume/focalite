import { notificationService } from '../services/notifications';
import { playBreakEnd, playBreakStart } from '../services/sounds';
import { preferences } from './preferences.svelte';
import { IntervalManager } from './store-utils';

export type TimerPhase = 'idle' | 'focus' | 'break';

// Small utility to format seconds as MM:SS for labels
function formatTime(secs: number): string {
	const total = Math.max(0, Math.floor(secs));
	const mins = Math.floor(total / 60);
	const s = total % 60;
	return `${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

class TimerStore {
	// --- Core reactive state ---
	phase = $state<TimerPhase>('idle');
	startedAt = $state<number | null>(null);
	baseElapsedSec = $state(0);
	now = $state(Date.now());

	// --- Session progress metrics ---
	sessionsCompleted = $state(0);
	totalFocusTime = $state(0);
	breaksCompleted = $state(0);
	totalBreakTime = $state(0);
	lastCompletedPhase = $state<TimerPhase | null>(null);
	lastCompletionAt = $state<number | null>(null);
	isManualCycle = $state(false);

	// --- Private runtime details ---
	// Lock duration when a session starts so preference tweaks mid-run do not affect timing.
	private lockedDuration = $state<number | null>(null);
	private intervalManager = new IntervalManager();

	// --- Duration helpers ---
	private getDurationForPhase(phase: TimerPhase): number {
		const minutes = phase === 'focus' ? preferences.focusMinutes : preferences.breakMinutes;
		return Math.max(1, Math.round(minutes * 60));
	}

	// When idle, currentDuration intentionally reports 0. UI components read
	// focus/break labels for idle displays; currentDuration feeds active math.
	currentDuration = $derived.by(() => {
		if (this.lockedDuration !== null) return this.lockedDuration;
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

	// --- Display helpers ---
	timeLabel = $derived.by(() =>
		formatTime(this.phase === 'idle' ? this.currentDuration : this.remaining)
	);

	breakDurationLabel = $derived.by(() => {
		const seconds =
			this.phase === 'break' && this.lockedDuration !== null
				? this.lockedDuration
				: this.getDurationForPhase('break');
		return formatTime(seconds);
	});

	focusDurationLabel = $derived.by(() => formatTime(this.getDurationForPhase('focus')));

	phaseLabel = $derived.by(() => {
		if (this.phase === 'idle') return 'Ready to focus';
		if (this.phase === 'focus') return this.running ? 'Focusing...' : 'Paused';
		return this.running ? 'On break' : 'Break paused';
	});

	progress = $derived.by(() => {
		if (this.phase === 'idle') return 0;
		return this.currentDuration > 0
			? (this.currentDuration - this.remaining) / this.currentDuration
			: 0;
	});

	// --- Visualization geometry ---
	readonly r = 45;
	readonly C = 2 * Math.PI * this.r;
	dashOffset = $derived(this.C * (1 - this.progress));

	// --- Timing loop ---
	private startInterval() {
		this.intervalManager.start(() => this.onTick(), 250);
	}

	private stopInterval() {
		this.intervalManager.stop();
	}

	private onTick() {
		this.now = Date.now();
		// Completion is handled here to avoid missing the transition if the
		// interval overshoots by a handful of milliseconds.
		if (this.startedAt && this.remaining <= 0) {
			this.onComplete();
		}
	}

	private onComplete() {
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
            // Notify and play sound on break completion
            notificationService.sendBreakEndNotification();
            playBreakEnd();
            if (preferences.autoLoop && !this.isManualCycle) {
                // Start next focus; no notifications/sounds on focus start
                this.startFocus();
            } else {
                this.reset();
            }
		}
	}

	// --- Public controls ---
    startFocus() {
        this.beginPhase('focus');
    }

    startBreak() {
        this.beginPhase('break');
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
			// Credit the partial focus session before switching.
			this.stopInterval();
			this.sessionsCompleted++;
			this.totalFocusTime += Math.floor(this.elapsed / 60);
			this.lastCompletedPhase = 'focus';
			this.lastCompletionAt = Date.now();
		} else if (this.phase === 'break') {
			return; // Already in break – nothing to do.
		}
		this.isManualCycle = true;
		this.startBreak();
	}

	// --- Phase orchestration ---
    private beginPhase(phase: Extract<TimerPhase, 'focus' | 'break'>) {
        this.stopInterval();
        this.phase = phase;
        this.lockedDuration = this.getDurationForPhase(phase);
        this.baseElapsedSec = 0;
        this.startedAt = Date.now();
        this.now = this.startedAt;
        this.startInterval();

        if (phase === 'break') {
            // Always notify and play break start (respecting sound prefs)
            notificationService.sendBreakStartNotification();
            playBreakStart();
        }
    }
}

export const timer = new TimerStore();
