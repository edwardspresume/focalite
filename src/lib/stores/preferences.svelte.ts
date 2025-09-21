import { load } from '@tauri-apps/plugin-store';
import type { Store } from '@tauri-apps/plugin-store';

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

let loadPromise: Promise<void> | null = null;
let storeInstance: Store | null = null;

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
				if (!storeInstance) {
					storeInstance = await load('preferences.json');
				}

				const focusMinutes = await storeInstance.get('focusMinutes') as number | null;
				const breakMinutes = await storeInstance.get('breakMinutes') as number | null;
				const autoLoop = await storeInstance.get('autoLoop') as boolean | null;

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
			if (!storeInstance) {
				storeInstance = await load('preferences.json');
			}
			await storeInstance.set(key, value);
			await storeInstance.save();
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
