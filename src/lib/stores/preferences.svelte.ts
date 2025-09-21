import { LazyStore } from '@tauri-apps/plugin-store';

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
		try {
			// Prefer a single IPC call (entries) over multiple get() calls to
			// minimize Tauri invoke round-trips and latency. Then runtime-check
			// and clamp values to defend against corrupted or user-edited files.
			const entries = await this.store.entries();
			const all = Object.fromEntries(entries);

			this.focusMinutes =
				typeof all.focusMinutes === 'number'
					? this.clampMinutes(all.focusMinutes)
					: DEFAULT_PREFERENCES.focusMinutes;

			this.breakMinutes =
				typeof all.breakMinutes === 'number'
					? this.clampMinutes(all.breakMinutes)
					: DEFAULT_PREFERENCES.breakMinutes;

			this.autoLoop =
				typeof all.autoLoop === 'boolean' ? all.autoLoop : DEFAULT_PREFERENCES.autoLoop;
		} catch (error) {
			console.error('Failed to load preferences:', error);
		}
	}

	private async save<K extends keyof Preferences>(key: K, value: Preferences[K]) {
		try {
			await this.store.set(key, value);
		} catch (error) {
			console.error(`Failed to save ${key}:`, error);
		}
	}

	// Clamp minutes to a safe range (≈1s–1440m) to avoid extreme values
	// from UI bugs or stale/corrupted persisted data.
	private clampMinutes(input: number) {
		const n = Number(input) || 0;
		return Math.max(0.016, Math.min(1440, n));
	}

	setFocusMinutes(minutes: number) {
		const value = this.clampMinutes(minutes);
		this.focusMinutes = value;
		this.save('focusMinutes', value);
	}

	setBreakMinutes(minutes: number) {
		const value = this.clampMinutes(minutes);
		this.breakMinutes = value;
		this.save('breakMinutes', value);
	}

	setAutoLoop(on: boolean) {
		this.autoLoop = !!on;
		this.save('autoLoop', this.autoLoop);
	}


}

export const preferences = new PreferencesStore();
