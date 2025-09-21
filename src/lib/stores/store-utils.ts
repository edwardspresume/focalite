// Shared utilities for store implementations

/**
 * Manages interval lifecycle for reactive stores
 */
export class IntervalManager {
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

/**
 * Validates and clamps numeric values to safe ranges
 */
export function validateNumber(value: unknown, defaultValue: number, min = 0, max = Infinity): number {
	const num = Number(value);
	if (typeof value !== 'number' || isNaN(num) || num < min || num > max) {
		return defaultValue;
	}
	return num;
}

/**
 * Clamps minutes to a reasonable range (≈1s–1440m)
 */
export function clampMinutes(input: number): number {
	return validateNumber(input, 0, 0.016, 1440);
}

/**
 * Creates a throttled function that delays execution
 */
export class Throttle {
	private timeoutId: ReturnType<typeof setTimeout> | null = null;

	execute(callback: () => void, delayMs: number) {
		if (this.timeoutId) return;

		this.timeoutId = setTimeout(() => {
			callback();
			this.timeoutId = null;
		}, delayMs);
	}

	clear() {
		if (this.timeoutId) {
			clearTimeout(this.timeoutId);
			this.timeoutId = null;
		}
	}

	get isPending() {
		return this.timeoutId !== null;
	}
}

/**
 * Wraps async operations with error handling
 */
export async function withErrorHandling<T>(
	operation: () => Promise<T>,
	errorMessage: string,
	defaultValue: T
): Promise<T> {
	try {
		return await operation();
	} catch (error) {
		console.error(errorMessage, error);
		return defaultValue;
	}
}

/**
 * Creates ISO date string (YYYY-MM-DD) from Date object
 */
export function getLocalDateString(date: Date): string {
	return date.toISOString().split('T')[0];
}