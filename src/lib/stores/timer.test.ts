import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { timer } from './timer.svelte';

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
			expect(timer.completedCycles).toBe(0);
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
			const focusDuration = 25 * 60; // 25 minutes in seconds
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

			// Complete a focus session
			vi.advanceTimersByTime(25 * 60 * 1000); // 25 minutes
			expect(timer.isComplete).toBe(true);

			// Start break after completing focus
			timer.startBreak();
			expect(timer.sessionsCompleted).toBe(1);
			expect(timer.lastCompletedPhase).toBe('focus');
		});
	});

	describe('Reset', () => {
		it('should reset all state to initial values', () => {
			// Set up some state
			timer.startFocus();
			vi.advanceTimersByTime(10000);
			timer.sessionsCompleted = 2;
			timer.completedCycles = 1;

			// Reset
			timer.reset();

			expect(timer.phase).toBe('idle');
			expect(timer.startedAt).toBeNull();
			expect(timer.elapsed).toBe(0);
			expect(timer.sessionsCompleted).toBe(0);
			expect(timer.completedCycles).toBe(0);
			expect(timer.running).toBe(false);
		});
	});

	describe('Time Formatting', () => {
		it('should format time label correctly', () => {
			timer.startFocus();
			expect(timer.timeLabel).toBe('25:00');

			vi.advanceTimersByTime(65000); // 1 minute 5 seconds
			expect(timer.timeLabel).toBe('23:55');
		});

		it('should pad single digit seconds', () => {
			timer.startFocus();
			vi.advanceTimersByTime((25 * 60 - 5) * 1000); // 5 seconds remaining
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
});