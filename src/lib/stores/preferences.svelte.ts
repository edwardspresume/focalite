import { LazyStore } from '@tauri-apps/plugin-store';
import { clampMinutes, validateNumber, withErrorHandling } from './store-utils';

export interface Preferences {
	focusMinutes: number;
	breakMinutes: number;
	autoLoop: boolean;
	soundEnabled: boolean;
	breakStartSound: boolean;
	breakEndSound: boolean;
	primaryColor: string; // hex color like #8e51ff
}

const DEFAULT_PREFERENCES: Preferences = {
	focusMinutes: 30,
	breakMinutes: 3,
	autoLoop: true,
	soundEnabled: true,
	breakStartSound: true,
	breakEndSound: true,
	// default aligns roughly with current theme primary (violet)
	primaryColor: '#8e51ff'
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
    soundEnabled = $state(DEFAULT_PREFERENCES.soundEnabled);
    breakStartSound = $state(DEFAULT_PREFERENCES.breakStartSound);
    breakEndSound = $state(DEFAULT_PREFERENCES.breakEndSound);
    primaryColor = $state(DEFAULT_PREFERENCES.primaryColor);
    readonly defaultPrimaryColor = DEFAULT_PREFERENCES.primaryColor;

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
            this.soundEnabled = typeof all.soundEnabled === 'boolean' ? all.soundEnabled : DEFAULT_PREFERENCES.soundEnabled;
            this.breakStartSound = typeof all.breakStartSound === 'boolean' ? all.breakStartSound : DEFAULT_PREFERENCES.breakStartSound;
            // Migrate: prefer explicit breakEndSound; fall back to legacy keys if present
            this.breakEndSound = typeof all.breakEndSound === 'boolean'
                ? all.breakEndSound
                : (typeof all.breakCompleteSound === 'boolean' ? all.breakCompleteSound : DEFAULT_PREFERENCES.breakEndSound);

            const hex = typeof all.primaryColor === 'string' ? all.primaryColor : DEFAULT_PREFERENCES.primaryColor;
            this.primaryColor = this.validateHex(hex) ? hex : DEFAULT_PREFERENCES.primaryColor;
            this.applyPrimaryColorToCSS();
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

	setSoundEnabled(on: boolean) {
		this.soundEnabled = !!on;
		this.save('soundEnabled', this.soundEnabled);
	}

    setBreakStartSound(on: boolean) {
        this.breakStartSound = !!on;
        this.save('breakStartSound', this.breakStartSound);
    }

    setBreakEndSound(on: boolean) {
        this.breakEndSound = !!on;
        this.save('breakEndSound', this.breakEndSound);
    }

    // Primary color (hex) handling
    setPrimaryColor(hex: string) {
        const value = this.validateHex(hex) ? hex : this.primaryColor;
        if (value === this.primaryColor) {
            // still apply in case of same value to ensure CSS is synced
            this.applyPrimaryColorToCSS();
            return;
        }
        this.primaryColor = value;
        this.applyPrimaryColorToCSS();
        this.save('primaryColor', value);
    }

    resetPrimaryColor() {
        // Delegate to setter to keep behavior consistent
        this.setPrimaryColor(this.defaultPrimaryColor);
    }

    private validateHex(hex: unknown): hex is string {
        if (typeof hex !== 'string') return false;
        // Accept #RRGGBB or #RGB
        return /^#(?:[0-9a-fA-F]{3}){1,2}$/.test(hex.trim());
    }

    private applyPrimaryColorToCSS() {
        // In Tauri/SvelteKit SPA this runs in the browser only
        if (typeof document === 'undefined') return;
        const root = document.documentElement;
        try {
            root.style.setProperty('--primary', this.primaryColor);
            root.style.setProperty('--ring', this.primaryColor);
            // Optional: keep sidebar primary in sync
            root.style.setProperty('--sidebar-primary', this.primaryColor);
        } catch {
            // no-op; CSS application is non-critical
        }
    }

}

export const preferences = new PreferencesStore();
