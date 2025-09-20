import { load } from '@tauri-apps/plugin-store';

export interface KVStore {
	get<T>(key: string): Promise<T | undefined>;
	set<T>(key: string, value: T): Promise<void>;
	save(): Promise<void>;
}

function isTauriEnvironment(): boolean {
	return typeof window !== 'undefined' && !!(window as any).__TAURI__;
}

class WebLocalStore implements KVStore {
	private readonly namespace: string;
	private cache: Record<string, unknown>;

	constructor(filename: string) {
		this.namespace = `focalite:${filename}`;
		try {
			const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(this.namespace) : null;
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
				localStorage.setItem(this.namespace, JSON.stringify(this.cache));
			}
		} catch {
			// Swallow storage failures in fallback mode
		}
	}
}

export function createStoreAccessor(filename: string): () => Promise<KVStore> {
	let instance: KVStore | null = null;
	let pending: Promise<KVStore> | null = null;

	return async () => {
		if (instance) return instance;
		if (pending) return pending;

		pending = (async () => {
			try {
				instance = isTauriEnvironment() ? await load(filename) : new WebLocalStore(filename);
			} catch (error) {
				console.error(`Failed to load store "${filename}":`, error);
				instance = new WebLocalStore(filename);
			}

			return instance;
		})();

		try {
			return await pending;
		} finally {
			pending = null;
		}
	};
}
