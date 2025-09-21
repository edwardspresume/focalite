import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock LazyStore
const mockLazyStore = {
	entries: vi.fn(),
	set: vi.fn()
};

vi.mock('@tauri-apps/plugin-store', () => ({
	LazyStore: vi.fn(() => mockLazyStore)
}));

// Mock store utilities since they're now imported
vi.mock('./store-utils', async (importOriginal) => {
	const actual = await importOriginal() as any;
	return {
		...actual,
		withErrorHandling: vi.fn(async (operation, errorMessage, defaultValue) => {
			try {
				return await operation();
			} catch (error) {
				console.error(errorMessage, error);
				return defaultValue;
			}
		})
	};
});

describe('PreferencesStore', () => {
	beforeEach(async () => {
		vi.clearAllMocks();
		vi.resetModules();

		// Reset mock store
		mockLazyStore.entries.mockResolvedValue([]);
		mockLazyStore.set.mockResolvedValue(undefined);
	});

	it('should initialize with default values', async () => {
		const { preferences } = await import('./preferences.svelte');

		expect(preferences.focusMinutes).toBe(30);
		expect(preferences.breakMinutes).toBe(3);
		expect(preferences.autoLoop).toBe(false);
	});

	it('should load preferences from store using entries()', async () => {
		mockLazyStore.entries.mockResolvedValue([
			['focusMinutes', 45],
			['breakMinutes', 10],
			['autoLoop', true]
		]);

		const { preferences } = await import('./preferences.svelte');

		// Wait for loading to complete
		await new Promise(resolve => setTimeout(resolve, 0));

		expect(preferences.focusMinutes).toBe(45);
		expect(preferences.breakMinutes).toBe(10);
		expect(preferences.autoLoop).toBe(true);
	});

	it('should use defaults when store is empty', async () => {
		mockLazyStore.entries.mockResolvedValue([]);

		const { preferences } = await import('./preferences.svelte');

		// Wait for loading to complete
		await new Promise(resolve => setTimeout(resolve, 0));

		expect(preferences.focusMinutes).toBe(30);
		expect(preferences.breakMinutes).toBe(3);
		expect(preferences.autoLoop).toBe(false);
	});

	it('should handle store loading errors gracefully', async () => {
		mockLazyStore.entries.mockRejectedValue(new Error('Store loading failed'));

		const { preferences } = await import('./preferences.svelte');

		// Wait for loading to complete
		await new Promise(resolve => setTimeout(resolve, 0));

		expect(preferences.focusMinutes).toBe(30); // Should use defaults
		expect(preferences.breakMinutes).toBe(3);
		expect(preferences.autoLoop).toBe(false);
	});

	it('should handle corrupted data with type checking and clamping', async () => {
		mockLazyStore.entries.mockResolvedValue([
			['focusMinutes', 'invalid'],
			['breakMinutes', -10],
			['autoLoop', 'not a boolean']
		]);

		const { preferences } = await import('./preferences.svelte');

		// Wait for loading to complete
		await new Promise(resolve => setTimeout(resolve, 0));

		expect(preferences.focusMinutes).toBe(30); // Invalid type, use default
		expect(preferences.breakMinutes).toBe(3); // Uses default from DEFAULT_PREFERENCES
		expect(preferences.autoLoop).toBe(false); // Invalid type, use default
	});

	it('should set focus minutes with clamping', async () => {
		const { preferences } = await import('./preferences.svelte');

		preferences.setFocusMinutes(25);
		expect(preferences.focusMinutes).toBe(25);
		expect(mockLazyStore.set).toHaveBeenCalledWith('focusMinutes', 25);

		// Test clamping too small value
		preferences.setFocusMinutes(-5);
		expect(preferences.focusMinutes).toBe(0.016);
		expect(mockLazyStore.set).toHaveBeenCalledWith('focusMinutes', 0.016);

		// Test clamping too large value
		preferences.setFocusMinutes(2000);
		expect(preferences.focusMinutes).toBe(1440);
		expect(mockLazyStore.set).toHaveBeenCalledWith('focusMinutes', 1440);
	});

	it('should set break minutes with clamping', async () => {
		const { preferences } = await import('./preferences.svelte');

		preferences.setBreakMinutes(15);
		expect(preferences.breakMinutes).toBe(15);
		expect(mockLazyStore.set).toHaveBeenCalledWith('breakMinutes', 15);

		// Test clamping too small value
		preferences.setBreakMinutes(-3);
		expect(preferences.breakMinutes).toBe(0.016);
		expect(mockLazyStore.set).toHaveBeenCalledWith('breakMinutes', 0.016);

		// Test clamping too large value
		preferences.setBreakMinutes(5000);
		expect(preferences.breakMinutes).toBe(1440);
		expect(mockLazyStore.set).toHaveBeenCalledWith('breakMinutes', 1440);
	});

	it('should set auto loop', async () => {
		const { preferences } = await import('./preferences.svelte');

		preferences.setAutoLoop(true);
		expect(preferences.autoLoop).toBe(true);
		expect(mockLazyStore.set).toHaveBeenCalledWith('autoLoop', true);

		preferences.setAutoLoop(false);
		expect(preferences.autoLoop).toBe(false);
		expect(mockLazyStore.set).toHaveBeenCalledWith('autoLoop', false);

		// Test truthy/falsy conversion
		preferences.setAutoLoop('truthy' as unknown as boolean);
		expect(preferences.autoLoop).toBe(true);
		expect(mockLazyStore.set).toHaveBeenCalledWith('autoLoop', true);
	});

	it('should handle save errors gracefully', async () => {
		mockLazyStore.set.mockRejectedValue(new Error('Save failed'));

		const { preferences } = await import('./preferences.svelte');

		// Should not throw, just log error
		preferences.setFocusMinutes(25);
		expect(preferences.focusMinutes).toBe(25);

		// Wait for async operation
		await new Promise(resolve => setTimeout(resolve, 10));
	});
});