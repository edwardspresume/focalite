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
	private store = new LazyStore('preferences.json');

	focusMinutes = $state(DEFAULT_PREFERENCES.focusMinutes);
	breakMinutes = $state(DEFAULT_PREFERENCES.breakMinutes);
	autoLoop = $state(DEFAULT_PREFERENCES.autoLoop);

	constructor() {
		this.load();
	}

	private async load() {
		try {
			const [focus, brk, loop] = await Promise.all([
				this.store.get('focusMinutes'),
				this.store.get('breakMinutes'),
				this.store.get('autoLoop')
			]);

			this.focusMinutes = (focus as number) ?? DEFAULT_PREFERENCES.focusMinutes;
			this.breakMinutes = (brk as number) ?? DEFAULT_PREFERENCES.breakMinutes;
			this.autoLoop = (loop as boolean) ?? DEFAULT_PREFERENCES.autoLoop;
		} catch (error) {
			console.error('Failed to load preferences:', error);
		}
	}

	private async save<K extends keyof Preferences>(key: K, value: Preferences[K]) {
		try {
			await this.store.set(key, value);
			await this.store.save();
		} catch (error) {
			console.error(`Failed to save ${key}:`, error);
		}
	}

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

	toggleAutoLoop() {
		this.autoLoop = !this.autoLoop;
		this.save('autoLoop', this.autoLoop);
	}
}

export const preferences = new PreferencesStore();
