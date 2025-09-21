import { LazyStore } from '@tauri-apps/plugin-store';
import { validateNumber, clampMinutes, withErrorHandling } from './store-utils';

export interface Preferences {
	focusMinutes: number;
	breakMinutes: number;
	autoLoop: boolean;
}

const DEFAULT_PREFERENCES: Preferences = {
	focusMinutes: 30,
	breakMinutes: 3,
	autoLoop: false
};

class PreferencesStore {
	// Initialize with defaults so fresh installs have a sane baseline.
	// This reduces undefined branches and writes defaults on first save.
	// Note: options are ignored if a Store for this path already exists.
	private store = new LazyStore('preferences.json', {
		defaults: { ...DEFAULT_PREFERENCES }
	});

	focusMinutes = $state(DEFAULT_PREFERENCES.focusMinutes);
	breakMinutes = $state(DEFAULT_PREFERENCES.breakMinutes);
	autoLoop = $state(DEFAULT_PREFERENCES.autoLoop);

	constructor() {
		this.load();
	}

	private async load() {
		await withErrorHandling(
			async () => {
				// Prefer a single IPC call (entries) over multiple get() calls to
				// minimize Tauri invoke round-trips and latency. Then runtime-check
				// and clamp values to defend against corrupted or user-edited files.
				const entries = await this.store.entries();
				const all = Object.fromEntries(entries);

				this.focusMinutes = clampMinutes(validateNumber(all.focusMinutes, DEFAULT_PREFERENCES.focusMinutes));
				this.breakMinutes = clampMinutes(validateNumber(all.breakMinutes, DEFAULT_PREFERENCES.breakMinutes));
				this.autoLoop = typeof all.autoLoop === 'boolean' ? all.autoLoop : DEFAULT_PREFERENCES.autoLoop;
			},
			'Failed to load preferences',
			undefined
		);
	}

	private async save<K extends keyof Preferences>(key: K, value: Preferences[K]) {
		await withErrorHandling(
			() => this.store.set(key, value),
			`Failed to save ${key}`,
			undefined
		);
	}

	setFocusMinutes(minutes: number) {
		const value = clampMinutes(minutes);
		this.focusMinutes = value;
		this.save('focusMinutes', value);
	}

	setBreakMinutes(minutes: number) {
		const value = clampMinutes(minutes);
		this.breakMinutes = value;
		this.save('breakMinutes', value);
	}

	setAutoLoop(on: boolean) {
		this.autoLoop = !!on;
		this.save('autoLoop', this.autoLoop);
	}


}

export const preferences = new PreferencesStore();
