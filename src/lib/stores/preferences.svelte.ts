import { load, type Store } from '@tauri-apps/plugin-store';

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

let store: Store | null = null;
let loadPromise: Promise<void> | null = null;

async function getStore(): Promise<Store> {
	if (!store) {
		try {
			store = await load('preferences.json');
		} catch (error) {
			console.error('Failed to load store:', error);
			throw error;
		}
	}
	return store;
}

class PreferencesStore {
	focusMinutes = $state(DEFAULT_PREFERENCES.focusMinutes);
	breakMinutes = $state(DEFAULT_PREFERENCES.breakMinutes);
	autoLoop = $state(DEFAULT_PREFERENCES.autoLoop);
	loaded = $state(false);

	constructor() {
		this.loadPreferences();
	}

	private async loadPreferences() {
		if (loadPromise) return loadPromise;

		loadPromise = (async () => {
			try {
				const store = await getStore();

				const focusMinutes = await store.get<number>('focusMinutes');
				const breakMinutes = await store.get<number>('breakMinutes');
				const autoLoop = await store.get<boolean>('autoLoop');

				this.focusMinutes = focusMinutes ?? DEFAULT_PREFERENCES.focusMinutes;
				this.breakMinutes = breakMinutes ?? DEFAULT_PREFERENCES.breakMinutes;
				this.autoLoop = autoLoop ?? DEFAULT_PREFERENCES.autoLoop;
				this.loaded = true;
			} catch (error) {
				console.error('Failed to load preferences:', error);
				this.loaded = true; // Mark as loaded even on error to prevent infinite loading
			}
		})();

		return loadPromise;
	}

	private async savePreference<K extends keyof Preferences>(key: K, value: Preferences[K]) {
		try {
			const store = await getStore();
			await store.set(key, value);
			await store.save();
		} catch (error) {
			console.error(`Failed to save ${key}:`, error);
		}
	}

	setFocusMinutes(min: number) {
		const n = Number(min);
		if (!Number.isNaN(n)) {
			const value = Math.max(1 / 60, n);
			this.focusMinutes = value;
			this.savePreference('focusMinutes', value);
		}
	}

	setBreakMinutes(min: number) {
		const n = Number(min);
		if (!Number.isNaN(n)) {
			const value = Math.max(1 / 60, n);
			this.breakMinutes = value;
			this.savePreference('breakMinutes', value);
		}
	}

	toggleAutoLoop() {
		this.autoLoop = !this.autoLoop;
		this.savePreference('autoLoop', this.autoLoop);
	}
}

export const preferences = new PreferencesStore();

// Legacy exports for backwards compatibility
export function setFocusMinutes(min: number) {
	preferences.setFocusMinutes(min);
}

export function setBreakMinutes(min: number) {
	preferences.setBreakMinutes(min);
}

export function toggleAutoLoop() {
	preferences.toggleAutoLoop();
}
