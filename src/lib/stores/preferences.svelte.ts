import { load } from '@tauri-apps/plugin-store';

// Minimal key/value store interface we rely on
interface KVStore {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T): Promise<void>;
  save(): Promise<void>;
}

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

let store: KVStore | null = null;
let loadPromise: Promise<void> | null = null;

function isTauri(): boolean {
  // Detect Tauri runtime presence safely
  return typeof window !== 'undefined' && !!(window as any).__TAURI__;
}

class WebLocalStore implements KVStore {
  private ns: string;
  private cache: Record<string, unknown>;

  constructor(filename: string) {
    this.ns = `focalite:${filename}`;
    try {
      const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(this.ns) : null;
      this.cache = raw ? JSON.parse(raw) : {};
    } catch {
      this.cache = {};
    }
  }

  async get<T>(key: string): Promise<T | undefined> {
    return this.cache[key] as T | undefined;
  }

  async set<T>(key: string, value: T): Promise<void> {
    this.cache[key] = value as unknown;
  }

  async save(): Promise<void> {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(this.ns, JSON.stringify(this.cache));
      }
    } catch {
      // noop in web fallback
    }
  }
}

async function getStore(): Promise<KVStore> {
  if (!store) {
    try {
      if (isTauri()) {
        store = await load('preferences.json');
      } else {
        // Web/dev fallback (frontend-only `pnpm dev`): use localStorage-backed store
        store = new WebLocalStore('preferences.json');
      }
    } catch (error) {
      console.error('Failed to load store:', error);
      // Last-resort fallback to in-memory web store to avoid crashing in dev
      store = new WebLocalStore('preferences.json');
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
