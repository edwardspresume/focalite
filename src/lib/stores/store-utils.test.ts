import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
	IntervalManager,
	validateNumber,
	clampMinutes,
	Throttle,
	withErrorHandling,
	getLocalDateString
} from './store-utils';

describe('Store Utils', () => {
	describe('IntervalManager', () => {
		let intervalManager: IntervalManager;

		beforeEach(() => {
			vi.useFakeTimers();
			intervalManager = new IntervalManager();
		});

		afterEach(() => {
			vi.restoreAllMocks();
		});

		it('should start and manage intervals', () => {
			const callback = vi.fn();

			intervalManager.start(callback, 1000);
			expect(intervalManager.isRunning).toBe(true);

			vi.advanceTimersByTime(1000);
			expect(callback).toHaveBeenCalledTimes(1);

			vi.advanceTimersByTime(1000);
			expect(callback).toHaveBeenCalledTimes(2);
		});

		it('should stop intervals', () => {
			const callback = vi.fn();

			intervalManager.start(callback, 1000);
			intervalManager.stop();
			expect(intervalManager.isRunning).toBe(false);

			vi.advanceTimersByTime(2000);
			expect(callback).not.toHaveBeenCalled();
		});

		it('should stop existing interval when starting new one', () => {
			const callback1 = vi.fn();
			const callback2 = vi.fn();

			intervalManager.start(callback1, 1000);
			intervalManager.start(callback2, 500);

			vi.advanceTimersByTime(500);
			expect(callback1).not.toHaveBeenCalled();
			expect(callback2).toHaveBeenCalledTimes(1);
		});
	});

	describe('validateNumber', () => {
		it('should return valid numbers unchanged', () => {
			expect(validateNumber(42, 0)).toBe(42);
			expect(validateNumber(0, 5)).toBe(0);
			expect(validateNumber(-10, 0, -20, 20)).toBe(-10);
		});

		it('should return default for invalid inputs', () => {
			expect(validateNumber('invalid', 5)).toBe(5);
			expect(validateNumber(null, 10)).toBe(10);
			expect(validateNumber(undefined, 15)).toBe(15);
			expect(validateNumber(NaN, 20)).toBe(20);
		});

		it('should respect min and max bounds', () => {
			expect(validateNumber(50, 0, 0, 10)).toBe(0); // Above max
			expect(validateNumber(-5, 0, 0, 10)).toBe(0); // Below min
			expect(validateNumber(5, 0, 0, 10)).toBe(5); // Within bounds
		});
	});

	describe('clampMinutes', () => {
		it('should clamp values to valid minute range', () => {
			expect(clampMinutes(30)).toBe(30);
			expect(clampMinutes(0)).toBe(0.016); // Below minimum
			expect(clampMinutes(-5)).toBe(0.016); // Negative
			expect(clampMinutes(2000)).toBe(1440); // Above maximum
			expect(clampMinutes(1440)).toBe(1440); // At maximum
			expect(clampMinutes(100)).toBe(100); // Within range
		});

		it('should handle invalid inputs', () => {
			expect(clampMinutes(NaN)).toBe(0.016);
			expect(clampMinutes(Infinity)).toBe(1440);
		});
	});

	describe('Throttle', () => {
		let throttle: Throttle;

		beforeEach(() => {
			vi.useFakeTimers();
			throttle = new Throttle();
		});

		afterEach(() => {
			vi.restoreAllMocks();
		});

		it('should execute callback after delay', () => {
			const callback = vi.fn();

			throttle.execute(callback, 1000);
			expect(callback).not.toHaveBeenCalled();
			expect(throttle.isPending).toBe(true);

			vi.advanceTimersByTime(1000);
			expect(callback).toHaveBeenCalledTimes(1);
			expect(throttle.isPending).toBe(false);
		});

		it('should ignore subsequent calls while pending', () => {
			const callback1 = vi.fn();
			const callback2 = vi.fn();

			throttle.execute(callback1, 1000);
			throttle.execute(callback2, 500); // Should be ignored

			vi.advanceTimersByTime(1000);
			expect(callback1).toHaveBeenCalledTimes(1);
			expect(callback2).not.toHaveBeenCalled();
		});

		it('should clear pending execution', () => {
			const callback = vi.fn();

			throttle.execute(callback, 1000);
			throttle.clear();
			expect(throttle.isPending).toBe(false);

			vi.advanceTimersByTime(1000);
			expect(callback).not.toHaveBeenCalled();
		});
	});

	describe('withErrorHandling', () => {
		it('should return operation result on success', async () => {
			const operation = vi.fn().mockResolvedValue('success');

			const result = await withErrorHandling(operation, 'Test error', 'default');
			expect(result).toBe('success');
			expect(operation).toHaveBeenCalledTimes(1);
		});

		it('should return default value on error', async () => {
			const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
			const operation = vi.fn().mockRejectedValue(new Error('Test error'));

			const result = await withErrorHandling(operation, 'Operation failed', 'default');
			expect(result).toBe('default');
			expect(consoleSpy).toHaveBeenCalledWith('Operation failed', expect.any(Error));

			consoleSpy.mockRestore();
		});
	});

	describe('getLocalDateString', () => {
		it('should format date as YYYY-MM-DD', () => {
			const date = new Date('2024-03-15T10:30:00Z');
			expect(getLocalDateString(date)).toBe('2024-03-15');
		});

		it('should handle different dates consistently', () => {
			const date1 = new Date('2023-12-01T23:59:59Z');
			const date2 = new Date('2025-01-01T00:00:00Z');

			expect(getLocalDateString(date1)).toBe('2023-12-01');
			expect(getLocalDateString(date2)).toBe('2025-01-01');
		});
	});
});