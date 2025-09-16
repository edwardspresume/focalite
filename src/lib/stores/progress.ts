import { load, type Store } from '@tauri-apps/plugin-store';

export interface DailyProgress {
  date: string; // YYYY-MM-DD (local)
  sessionsCompleted: number;
  breaksCompleted: number;
  focusMinutes: number; // total focused minutes for the day
  breakMinutes: number; // total break minutes for the day
}

const DEFAULT_PROGRESS = (): DailyProgress => ({
  date: getLocalDateString(new Date()),
  sessionsCompleted: 0,
  breaksCompleted: 0,
  focusMinutes: 0,
  breakMinutes: 0
});

let store: Store | null = null;
let lastSaved = 0;
let lastSnapshot = '';

async function getStore(): Promise<Store> {
  if (!store) {
    try {
      store = await load('progress.json');
      console.log('Progress store loaded');
    } catch (error) {
      console.error('Failed to load progress store:', error);
      throw error;
    }
  }
  return store;
}

export function getLocalDateString(d: Date): string {
  // Format as YYYY-MM-DD in local time
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function snapshotString(p: DailyProgress): string {
  return JSON.stringify(p);
}

/** Load today's progress. If stored date != today, reset and return fresh totals. */
export async function loadTodayProgress(): Promise<DailyProgress> {
  const today = getLocalDateString(new Date());

  try {
    const s = await getStore();
    const stored = await s.get<DailyProgress>('dailyProgress');

    // Always ensure we have today's record
    const progress = (!stored || stored.date !== today)
      ? { ...DEFAULT_PROGRESS(), date: today }
      : stored;

    // Save if we created a fresh record
    if (!stored || stored.date !== today) {
      try {
        await s.set('dailyProgress', progress);
        await s.save();
      } catch (e) {
        console.warn('Could not save reset daily progress (non-Tauri dev?):', e);
      }
    }

    lastSnapshot = snapshotString(progress);
    return progress;
  } catch (error) {
    console.warn('loadTodayProgress failed, returning defaults:', error);
    const fresh = DEFAULT_PROGRESS();
    lastSnapshot = snapshotString(fresh);
    return fresh;
  }
}

/** Save progress immediately to disk. */
export async function saveTodayProgress(progress: DailyProgress): Promise<void> {
  try {
    const s = await getStore();
    await s.set('dailyProgress', progress);
    await s.save();
    lastSaved = Date.now();
    lastSnapshot = snapshotString(progress);
  } catch (error) {
    // In frontend-only dev, store may be unavailable; fail gracefully
    console.warn('saveTodayProgress failed (non-Tauri dev?):', error);
  }
}

/** Save progress if throttle interval elapsed or values changed. */
export async function saveTodayProgressThrottled(
  progress: DailyProgress,
  throttleMs = 15000
): Promise<void> {
  const now = Date.now();
  const snap = snapshotString(progress);
  if (snap === lastSnapshot && now - lastSaved < throttleMs) return;
  await saveTodayProgress(progress);
}

/** Reset and persist a fresh record for today. */
export async function resetAndSaveForToday(): Promise<DailyProgress> {
  const fresh = DEFAULT_PROGRESS();
  await saveTodayProgress(fresh);
  return fresh;
}

