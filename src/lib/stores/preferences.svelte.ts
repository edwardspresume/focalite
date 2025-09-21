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

let storeInstance: Store | null = null;

class PreferencesStore {
	focusMinutes = $state(DEFAULT_PREFERENCES.focusMinutes);
	breakMinutes = $state(DEFAULT_PREFERENCES.breakMinutes);
	autoLoop = $state(DEFAULT_PREFERENCES.autoLoop);

	constructor() {
		this.load();
	}

	private async load() {
		try {
			if (!storeInstance) {
				storeInstance = await load('preferences.json');
			}

			const data = await Promise.all([
				storeInstance.get('focusMinutes'),
				storeInstance.get('breakMinutes'),
				storeInstance.get('autoLoop')
			]);

			this.focusMinutes = (data[0] as number) ?? DEFAULT_PREFERENCES.focusMinutes;
			this.breakMinutes = (data[1] as number) ?? DEFAULT_PREFERENCES.breakMinutes;
			this.autoLoop = (data[2] as boolean) ?? DEFAULT_PREFERENCES.autoLoop;
		} catch (error) {
			console.error('Failed to load preferences:', error);
		}
	}

	private async save<K extends keyof Preferences>(key: K, value: Preferences[K]) {
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

	setFocusMinutes(minutes: number) {
		const value = Math.max(0.016, Math.min(1440, Number(minutes) || 0));
		this.focusMinutes = value;
		this.save('focusMinutes', value);
	}

	setBreakMinutes(minutes: number) {
		const value = Math.max(0.016, Math.min(1440, Number(minutes) || 0));
		this.breakMinutes = value;
		this.save('breakMinutes', value);
	}

	toggleAutoLoop() {
		this.autoLoop = !this.autoLoop;
		this.save('autoLoop', this.autoLoop);
	}
}

export const preferences = new PreferencesStore();
