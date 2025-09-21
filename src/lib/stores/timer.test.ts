import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { timer } from './timer.svelte';

// Mock store utilities since they're now imported
vi.mock('./store-utils', () => ({
	IntervalManager: class MockIntervalManager {
		private interval: ReturnType<typeof setInterval> | null = null;

		start(callback: () => void, intervalMs: number) {
			this.stop();
			this.interval = setInterval(callback, intervalMs);
		}

		stop() {
			if (this.interval) {
				clearInterval(this.interval);
				this.interval = null;
			}
		}

		get isRunning() {
			return this.interval !== null;
		}
	}
}));

describe('Timer Store', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		timer.reset();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('Initial State', () => {
		it('should start in idle phase', () => {
			expect(timer.phase).toBe('idle');
			expect(timer.startedAt).toBeNull();
			expect(timer.running).toBe(false);
		});

		it('should have zero progress initially', () => {
			expect(timer.sessionsCompleted).toBe(0);
			expect(timer.totalFocusTime).toBe(0);
			expect(timer.breaksCompleted).toBe(0);
		});
	});

	describe('Start Focus', () => {
		it('should transition from idle to focus phase', () => {
			timer.startFocus();
			expect(timer.phase).toBe('focus');
			expect(timer.running).toBe(true);
			expect(timer.startedAt).not.toBeNull();
		});

		it('should calculate remaining time correctly', () => {
			const focusDuration = 30 * 60; // 30 minutes in seconds (default)
			timer.startFocus();

			// Initially should have full time remaining
			expect(timer.remaining).toBe(focusDuration);

			// Advance 10 seconds
			vi.advanceTimersByTime(10000);
			expect(timer.remaining).toBe(focusDuration - 10);
		});
	});

	describe('Pause and Resume', () => {
		it('should pause timer and preserve elapsed time', () => {
			timer.startFocus();

			// Let 5 seconds pass
			vi.advanceTimersByTime(5000);
			const elapsedBeforePause = timer.elapsed;

			timer.pause();
			expect(timer.running).toBe(false);
			expect(timer.startedAt).toBeNull();
			expect(timer.baseElapsedSec).toBe(elapsedBeforePause);

			// Time passing while paused shouldn't affect elapsed time
			vi.advanceTimersByTime(10000);
			expect(timer.elapsed).toBe(elapsedBeforePause);
		});

		it('should resume from where it left off', () => {
			timer.startFocus();
			vi.advanceTimersByTime(5000);
			const elapsedBeforePause = timer.elapsed;

			timer.pause();
			vi.advanceTimersByTime(3000); // 3 seconds while paused

			timer.resume();
			expect(timer.running).toBe(true);
			expect(timer.elapsed).toBe(elapsedBeforePause);

			// Continue counting after resume
			vi.advanceTimersByTime(2000);
			expect(timer.elapsed).toBe(elapsedBeforePause + 2);
		});
	});

	describe('Phase Transitions', () => {
		it('should transition from focus to break when starting break', () => {
			timer.startFocus();
			timer.startBreak();

			expect(timer.phase).toBe('break');
			expect(timer.elapsed).toBe(0);
			expect(timer.running).toBe(true);
		});

		it('should track completed sessions', () => {
			timer.startFocus();

			// Complete a focus session by advancing time and triggering timer tick
			vi.advanceTimersByTime(30 * 60 * 1000 + 250); // 30 minutes + one timer tick

			// Check that the completion was handled (completion auto-triggers transition to break)
			expect(timer.sessionsCompleted).toBe(1);
			expect(timer.lastCompletedPhase).toBe('focus');
			expect(timer.phase).toBe('break'); // Should auto-transition to break
		});
	});

	describe('Reset', () => {
		it('should reset all state to initial values', () => {
			// Set up some state
			timer.startFocus();
			vi.advanceTimersByTime(10000);

			// Reset
			timer.reset();

			expect(timer.phase).toBe('idle');
			expect(timer.startedAt).toBeNull();
			expect(timer.elapsed).toBe(0);
			expect(timer.running).toBe(false);
			expect(timer.isManualCycle).toBe(false);
		});
	});

	describe('Time Formatting', () => {
		it('should format time label correctly', () => {
			timer.startFocus();
			expect(timer.timeLabel).toBe('30:00');

			vi.advanceTimersByTime(65000); // 1 minute 5 seconds
			expect(timer.timeLabel).toBe('28:55');
		});

		it('should pad single digit seconds', () => {
			timer.startFocus();
			vi.advanceTimersByTime((30 * 60 - 5) * 1000); // 5 seconds remaining
			expect(timer.timeLabel).toBe('00:05');
		});
	});

	describe('Auto-loop Behavior', () => {
		it('should handle auto-loop transitions when enabled', () => {
			// This test would need access to preferences store
			// and would test the auto-loop functionality
			// Implementation depends on how preferences are mocked
		});
	});

	describe('Manual Break Functionality', () => {
		it('should start manual break from idle phase', () => {
			timer.startManualBreak();
			expect(timer.phase).toBe('break');
			expect(timer.isManualCycle).toBe(true);
			expect(timer.running).toBe(true);
		});

		it('should start manual break from focus phase', () => {
			// Ensure clean state
			timer.reset();
			const baseline = timer.sessionsCompleted;
			timer.startFocus();
			vi.advanceTimersByTime(10000); // 10 seconds into focus

			timer.startManualBreak();
			expect(timer.phase).toBe('break');
			expect(timer.isManualCycle).toBe(true);
			expect(timer.sessionsCompleted).toBe(baseline + 1); // Should record partial focus
		});

		it('should be no-op when already in break phase', () => {
			timer.startFocus();
			timer.startManualBreak(); // First manual break
			const breakStartTime = timer.startedAt;

			timer.startManualBreak(); // Second call should be no-op
			expect(timer.phase).toBe('break');
			expect(timer.startedAt).toBe(breakStartTime); // Should not restart
		});

		it('should prevent auto-loop after manual break completes', () => {
			timer.startManualBreak();
			expect(timer.isManualCycle).toBe(true);

			// Complete the break
			vi.advanceTimersByTime(3 * 60 * 1000 + 250); // 3 minutes + timer tick

			// Should go to idle, not auto-start focus (even if auto-loop enabled)
			expect(timer.phase).toBe('idle');
			expect(timer.isManualCycle).toBe(false); // Reset on idle
		});
	});
});
