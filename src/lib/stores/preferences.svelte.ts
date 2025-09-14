import { load, type Store } from '@tauri-apps/plugin-store';

export interface Preferences {
  focusDurationMin: number;
  breakDurationMin: number;
  autoLoop: boolean;
}

const DEFAULT_PREFERENCES: Preferences = {
  focusDurationMin: 30,
  breakDurationMin: 3,
  autoLoop: false
};

// Svelte 5 best practice: Use $state with object that won't be reassigned
export const preferences = $state({
  focusDurationMin: DEFAULT_PREFERENCES.focusDurationMin,
  breakDurationMin: DEFAULT_PREFERENCES.breakDurationMin,
  autoLoop: DEFAULT_PREFERENCES.autoLoop
});

// Loading and error states
export const preferenceState = $state({
  loaded: false,
  loading: false,
  error: null as string | null
});

// Derived state for convenience - must be a function for module exports
export function isReady(): boolean {
  return preferenceState.loaded && !preferenceState.loading;
}

// Private store instance
let store: Store | null = null;

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

export async function loadPreferences(): Promise<Preferences> {
  if (preferenceState.loading || preferenceState.loaded) {
    return preferences;
  }

  preferenceState.loading = true;
  preferenceState.error = null;

  try {
    const tauriStore = await getStore();

    const focusDurationMin = await tauriStore.get<number>('focusDurationMin');
    const breakDurationMin = await tauriStore.get<number>('breakDurationMin');
    const autoLoop = await tauriStore.get<boolean>('autoLoop');

    // Update reactive state directly (this triggers reactivity)
    preferences.focusDurationMin = focusDurationMin ?? DEFAULT_PREFERENCES.focusDurationMin;
    preferences.breakDurationMin = breakDurationMin ?? DEFAULT_PREFERENCES.breakDurationMin;
    preferences.autoLoop = autoLoop ?? DEFAULT_PREFERENCES.autoLoop;

    preferenceState.loaded = true;
    return preferences;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    preferenceState.error = message;
    console.error('Failed to load preferences:', error);

    // Reset to defaults on error
    Object.assign(preferences, DEFAULT_PREFERENCES);
    preferenceState.loaded = true;
    return preferences;
  } finally {
    preferenceState.loading = false;
  }
}

export async function savePreferences(updates: Partial<Preferences>): Promise<void> {
  try {
    const tauriStore = await getStore();

    // Update reactive state immediately (optimistic UI)
    if (updates.focusDurationMin !== undefined) {
      preferences.focusDurationMin = updates.focusDurationMin;
      await tauriStore.set('focusDurationMin', updates.focusDurationMin);
    }
    if (updates.breakDurationMin !== undefined) {
      preferences.breakDurationMin = updates.breakDurationMin;
      await tauriStore.set('breakDurationMin', updates.breakDurationMin);
    }
    if (updates.autoLoop !== undefined) {
      preferences.autoLoop = updates.autoLoop;
      await tauriStore.set('autoLoop', updates.autoLoop);
    }

    await tauriStore.save();
    preferenceState.error = null;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Save failed';
    preferenceState.error = message;
    console.error('Failed to save preferences:', error);

    // Rollback optimistic update on error
    await loadPreferences();
    throw error;
  }
}

// Convenience functions for individual updates
export async function saveFocusDuration(minutes: number): Promise<void> {
  await savePreferences({ focusDurationMin: minutes });
}

export async function saveBreakDuration(minutes: number): Promise<void> {
  await savePreferences({ breakDurationMin: minutes });
}

export async function saveAutoLoop(enabled: boolean): Promise<void> {
  await savePreferences({ autoLoop: enabled });
}