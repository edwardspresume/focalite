import { describe, expect, it } from 'vitest';
import { getLocalDateString, validateNumber } from './store-utils';

// Test progress store utilities and interface separately to avoid circular dependency issues
describe('Progress Store Utils', () => {
	describe('validateNumber for progress data', () => {
		it('should validate progress values correctly', () => {
			expect(validateNumber(5, 0)).toBe(5);
			expect(validateNumber(-1, 0)).toBe(0); // Negative values should default
			expect(validateNumber('invalid', 0)).toBe(0);
			expect(validateNumber(null, 0)).toBe(0);
			expect(validateNumber(undefined, 0)).toBe(0);
		});
	});

	describe('getLocalDateString for progress dates', () => {
		it('should format dates consistently for progress tracking', () => {
			const date = new Date('2024-03-15T10:30:00Z');
			expect(getLocalDateString(date)).toBe('2024-03-15');
		});
	});

	describe('DailyProgress interface validation', () => {
		it('should handle complete progress data', () => {
			const progress = {
				date: '2024-03-15',
				sessionsCompleted: 5,
				breaksCompleted: 3,
				focusMinutes: 150,
				breakMinutes: 9
			};

			expect(progress.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
			expect(validateNumber(progress.sessionsCompleted, 0)).toBe(5);
			expect(validateNumber(progress.breaksCompleted, 0)).toBe(3);
			expect(validateNumber(progress.focusMinutes, 0)).toBe(150);
			expect(validateNumber(progress.breakMinutes, 0)).toBe(9);
		});

		it('should sanitize corrupted progress data', () => {
			const corruptedProgress = {
				date: '2024-03-15',
				sessionsCompleted: -1,
				breaksCompleted: 'invalid',
				focusMinutes: 100,
				breakMinutes: null
			};

			expect(validateNumber(corruptedProgress.sessionsCompleted, 0)).toBe(0);
			expect(validateNumber(corruptedProgress.breaksCompleted as any, 0)).toBe(0);
			expect(validateNumber(corruptedProgress.focusMinutes, 0)).toBe(100);
			expect(validateNumber(corruptedProgress.breakMinutes as any, 0)).toBe(0);
		});
	});
});
