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

let store: Store | null = null;

async function getStore(): Promise<Store> {
  if (!store) {
    try {
      store = await load('preferences.json');
      console.log('Store loaded successfully');
    } catch (error) {
      console.error('Failed to load store:', error);
      throw error;
    }
  }
  return store;
}

export async function loadPreferences(): Promise<Preferences> {
  try {
    const store = await getStore();

    const focusDurationMin = await store.get<number>('focusDurationMin');
    const breakDurationMin = await store.get<number>('breakDurationMin');
    const autoLoop = await store.get<boolean>('autoLoop');

    return {
      focusDurationMin: focusDurationMin ?? DEFAULT_PREFERENCES.focusDurationMin,
      breakDurationMin: breakDurationMin ?? DEFAULT_PREFERENCES.breakDurationMin,
      autoLoop: autoLoop ?? DEFAULT_PREFERENCES.autoLoop
    };
  } catch (error) {
    console.error('Failed to load preferences:', error);
    return DEFAULT_PREFERENCES;
  }
}

export async function savePreferences(preferences: Partial<Preferences>): Promise<void> {
  try {
    const store = await getStore();

    if (preferences.focusDurationMin !== undefined) {
      await store.set('focusDurationMin', preferences.focusDurationMin);
      console.log('Saved focusDurationMin:', preferences.focusDurationMin);
    }
    if (preferences.breakDurationMin !== undefined) {
      await store.set('breakDurationMin', preferences.breakDurationMin);
      console.log('Saved breakDurationMin:', preferences.breakDurationMin);
    }
    if (preferences.autoLoop !== undefined) {
      await store.set('autoLoop', preferences.autoLoop);
      console.log('Saved autoLoop:', preferences.autoLoop);
    }

    await store.save();
    console.log('Preferences saved to disk');
  } catch (error) {
    console.error('Failed to save preferences:', error);
    throw error;
  }
}

export async function saveFocusDuration(minutes: number): Promise<void> {
  await savePreferences({ focusDurationMin: minutes });
}

export async function saveBreakDuration(minutes: number): Promise<void> {
  await savePreferences({ breakDurationMin: minutes });
}

export async function saveAutoLoop(enabled: boolean): Promise<void> {
  await savePreferences({ autoLoop: enabled });
}