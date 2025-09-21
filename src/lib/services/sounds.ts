// Minimal functional sound helpers: only break start/end.
// Creates a fresh Audio element for each play.

import { preferences } from '$lib/stores/preferences.svelte';

type SoundKey = 'breakStart' | 'breakEnd';

const SOUND_SRC: Record<SoundKey, string> = {
  breakStart: '/break-start.mp3',
  breakEnd: '/break-end.mp3'
};

function isEnabled(key: SoundKey): boolean {
  if (!preferences.soundEnabled) return false;
  if (key === 'breakStart') return !!preferences.breakStartSound;
  if (key === 'breakEnd') return !!preferences.breakEndSound;
  return true;
}

const warned = new Set<string>();

async function tryPlay(src: string, warnKey: string) {
  try {
    const el = new Audio(src);
    el.currentTime = 0;
    await el.play();
    return true;
  } catch (err) {
    if (!warned.has(warnKey)) {
      warned.add(warnKey);
      console.warn('Failed to play sound', warnKey, err);
    }
    return false;
  }
}

async function play(key: SoundKey) {
  if (!isEnabled(key)) return;

  const primary = SOUND_SRC[key];
  const ok = await tryPlay(primary, `${key}:${primary}`);
  if (ok) return;

  // Legacy fallback for break-end naming
  if (key === 'breakEnd') {
    await tryPlay('/break-complete.mp3', `${key}:/break-complete.mp3`);
  }
}

export function playBreakStart() {
  return play('breakStart');
}

export function playBreakEnd() {
  return play('breakEnd');
}
