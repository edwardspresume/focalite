import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';

// Mock Tauri store
vi.mock('@tauri-apps/plugin-store', () => ({
	load: vi.fn(() => ({
		get: vi.fn(),
		set: vi.fn(),
		save: vi.fn()
	}))
}));

describe('PreferencesStore', () => {
	let mockStore: {
		get: Mock;
		set: Mock;
		save: Mock;
	};

	beforeEach(async () => {
		vi.clearAllMocks();

		// Reset module state
		vi.resetModules();

		mockStore = {
			get: vi.fn(),
			set: vi.fn(),
			save: vi.fn()
		};

		const { load } = await import('@tauri-apps/plugin-store');
		(load as Mock).mockResolvedValue(mockStore);
	});

	it('should initialize with default values', async () => {
		const { preferences } = await import('./preferences.svelte');

		expect(preferences.focusMinutes).toBe(30);
		expect(preferences.breakMinutes).toBe(3);
		expect(preferences.autoLoop).toBe(false);
		// loaded state will be true after constructor runs async load
		// expect(preferences.loaded).toBe(false);
	});

	it('should load preferences from store', async () => {
		mockStore.get.mockImplementation((key: string) => {
			switch (key) {
				case 'focusMinutes': return Promise.resolve(45);
				case 'breakMinutes': return Promise.resolve(10);
				case 'autoLoop': return Promise.resolve(true);
				default: return Promise.resolve(null);
			}
		});

		const { preferences } = await import('./preferences.svelte');

		// Wait for loading to complete
		await new Promise(resolve => setTimeout(resolve, 0));

		expect(preferences.focusMinutes).toBe(45);
		expect(preferences.breakMinutes).toBe(10);
		expect(preferences.autoLoop).toBe(true);
	});

	it('should use defaults when store values are null', async () => {
		mockStore.get.mockResolvedValue(null);

		const { preferences } = await import('./preferences.svelte');

		// Wait for loading to complete
		await new Promise(resolve => setTimeout(resolve, 0));

		expect(preferences.focusMinutes).toBe(30);
		expect(preferences.breakMinutes).toBe(3);
		expect(preferences.autoLoop).toBe(false);
	});

	it('should handle store loading errors gracefully', async () => {
		const { load } = await import('@tauri-apps/plugin-store');
		(load as Mock).mockRejectedValue(new Error('Store loading failed'));

		const { preferences } = await import('./preferences.svelte');

		// Wait for loading to complete
		await new Promise(resolve => setTimeout(resolve, 0));

		expect(preferences.focusMinutes).toBe(30); // Should use defaults
	});

	it('should set focus minutes with validation', async () => {
		const { preferences } = await import('./preferences.svelte');

		preferences.setFocusMinutes(25);
		expect(preferences.focusMinutes).toBe(25);

		// Wait for async save operation
		await new Promise(resolve => setTimeout(resolve, 0));
		expect(mockStore.set).toHaveBeenCalledWith('focusMinutes', 25);
		expect(mockStore.save).toHaveBeenCalled();
	});

	it('should clamp invalid focus minutes to valid range', async () => {
		const { preferences } = await import('./preferences.svelte');

		// Test too small value
		preferences.setFocusMinutes(-5);
		expect(preferences.focusMinutes).toBe(0.016); // Clamped to minimum

		// Test too large value
		preferences.setFocusMinutes(2000);
		expect(preferences.focusMinutes).toBe(1440); // Clamped to maximum
	});

	it('should set break minutes with validation', async () => {
		const { preferences } = await import('./preferences.svelte');

		preferences.setBreakMinutes(15);
		expect(preferences.breakMinutes).toBe(15);

		// Wait for async save operation
		await new Promise(resolve => setTimeout(resolve, 0));
		expect(mockStore.set).toHaveBeenCalledWith('breakMinutes', 15);
		expect(mockStore.save).toHaveBeenCalled();
	});

	it('should clamp invalid break minutes to valid range', async () => {
		const { preferences } = await import('./preferences.svelte');

		// Test too small value
		preferences.setBreakMinutes(-3);
		expect(preferences.breakMinutes).toBe(0.016); // Clamped to minimum

		// Test too large value
		preferences.setBreakMinutes(5000);
		expect(preferences.breakMinutes).toBe(1440); // Clamped to maximum
	});

	it('should toggle auto loop', async () => {
		const { preferences } = await import('./preferences.svelte');

		const originalValue = preferences.autoLoop;
		preferences.toggleAutoLoop();

		expect(preferences.autoLoop).toBe(!originalValue);

		// Wait for async save operation
		await new Promise(resolve => setTimeout(resolve, 0));

		expect(mockStore.set).toHaveBeenCalledWith('autoLoop', !originalValue);
		expect(mockStore.save).toHaveBeenCalled();
	});

	it('should handle save errors gracefully', async () => {
		mockStore.save.mockRejectedValue(new Error('Save failed'));

		const { preferences } = await import('./preferences.svelte');

		// Should not throw, just log error
		preferences.setFocusMinutes(25);
		expect(preferences.focusMinutes).toBe(25);

		// Wait for async operation
		await new Promise(resolve => setTimeout(resolve, 10));
	});
});