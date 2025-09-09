<script lang="ts">
  import { invoke } from '@tauri-apps/api/core';

  type TimerPhase = 'focus' | 'break' | 'idle';

  // Base state
  let focusDurationSec = $state(25 * 60); // 25 minutes
  let breakDurationSec = $state(5 * 60); // 5 minutes
  let currentPhase: TimerPhase = $state('idle');
  let startedAt: number | null = $state(null);
  let now = $state(Date.now());
  let baseElapsedSec = $state(0);

  // Derived state
  const currentDuration = $derived(() =>
    currentPhase === 'focus'
      ? focusDurationSec
      : currentPhase === 'break'
        ? breakDurationSec
        : 0
  );
  const elapsed = $derived(() =>
    (startedAt ? Math.floor((now - startedAt) / 1000) : 0) + baseElapsedSec
  );
  const remaining = $derived(() => Math.max(currentDuration() - elapsed(), 0));
  const running = $derived(() => startedAt !== null && remaining() > 0);
  const isTimerComplete = $derived(
    () => startedAt !== null && remaining() === 0
  );

  const progress = $derived(() =>
    currentDuration() > 0 ? Math.min(elapsed() / currentDuration(), 1) : 0
  );
  const phaseLabel = $derived.by(() =>
    currentPhase === 'idle'
      ? 'Ready to Focus'
      : currentPhase === 'focus'
        ? 'Focus Time'
        : 'Break Time'
  );

  // Progress ring constants
  const ringR = 84;
  const ringStroke = 12;
  const ringSize = 2 * (ringR + ringStroke);
  const ringCirc = 2 * Math.PI * ringR;

  // Format time display
  const formatTime = $derived.by(() => {
    const mins = Math.floor(remaining() / 60);
    const secs = remaining() % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  });

  // Tick only while running
  $effect(() => {
    if (!running()) return;
    const id = setInterval(() => {
      now = Date.now();
    }, 250);
    return () => clearInterval(id);
  });

  // Handle automatic phase transitions
  $effect(() => {
    if (!isTimerComplete()) return;

    if (currentPhase === 'focus') {
      // Automatically transition to break and start enforced break
      startBreak();
    } else if (currentPhase === 'break') {
      // Break completed, return to idle
      exitBreakMode();
      currentPhase = 'idle';
      startedAt = null;
      baseElapsedSec = 0;
    }
  });

  async function startFocus() {
    if (running()) return;

    currentPhase = 'focus';
    baseElapsedSec = 0;
    startedAt = Date.now();
    now = startedAt;
  }

  async function startBreak() {
    currentPhase = 'break';
    baseElapsedSec = 0;
    startedAt = Date.now();
    now = startedAt;

    // Make window fullscreen and always on top for break mode
    try {
      await invoke('enter_break_mode');
    } catch (error) {
      console.error('Failed to enter break mode:', error);
    }
  }

  function pause() {
    if (startedAt === null) return;
    baseElapsedSec = elapsed();
    startedAt = null;
  }

  function resume() {
    if (startedAt !== null || currentPhase === 'idle') return;
    startedAt = Date.now();
    now = startedAt;
  }

  async function reset() {
    if (currentPhase === 'break') {
      await exitBreakMode();
    }
    currentPhase = 'idle';
    startedAt = null;
    baseElapsedSec = 0;
  }

  async function exitBreakMode() {
    try {
      await invoke('exit_break_mode');
    } catch (error) {
      console.error('Failed to exit break mode:', error);
    }
  }

  function setFocusDuration(minutes: number) {
    if (!running()) {
      focusDurationSec = minutes * 60;
      console.log(
        `Focus duration set to ${minutes} minutes (${focusDurationSec} seconds)`
      );
    }
  }

  function setBreakDuration(minutes: number) {
    if (!running()) {
      breakDurationSec = minutes * 60;
    }
  }

  function applyPreset(focusMin: number, breakMin: number) {
    if (currentPhase !== 'idle') return;
    setFocusDuration(focusMin);
    setBreakDuration(breakMin);
  }

  // Keyboard shortcuts: Space (start/pause/resume), Esc (reset), B (start break)
  $effect(() => {
    if (typeof window === 'undefined') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        if (currentPhase === 'idle') startFocus();
        else if (running()) pause();
        else resume();
        return;
      }
      if (e.key === 'Escape') {
        reset();
        return;
      }
      if (e.key === 'b' || e.key === 'B') {
        if (currentPhase !== 'break') startBreak();
        return;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

</script>

<main class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
  <div class="bg-white/90 backdrop-blur rounded-2xl shadow-xl p-8 w-full max-w-xl border border-white/60">
    <!-- Header -->
    <div class="text-center mb-8">
      <h1 class="text-3xl font-bold text-gray-900 tracking-tight">Focalite</h1>
      <p class="text-gray-600 text-sm">Focus timer with enforced breaks</p>
    </div>

    <!-- Timer Display with Progress Ring -->
    <div class="flex items-center justify-center mb-8">
      <div class="relative" aria-label={phaseLabel} role="region">
        {#key currentPhase}
          <svg
            width={ringSize}
            height={ringSize}
            viewBox={`0 0 ${ringSize} ${ringSize}`}
            class="drop-shadow-sm"
            role="progressbar"
            aria-valuemin="0"
            aria-valuemax="100"
            aria-valuenow={Math.round(progress() * 100)}
          >
            <circle
              cx={ringSize / 2}
              cy={ringSize / 2}
              r={ringR}
              stroke="currentColor"
              class="text-gray-200"
              stroke-width={ringStroke}
              fill="none"
            />
            <g transform={`rotate(-90 ${ringSize / 2} ${ringSize / 2})`}>
              <circle
                cx={ringSize / 2}
                cy={ringSize / 2}
                r={ringR}
                stroke="currentColor"
                class={`${currentPhase === 'focus' ? 'text-green-500' : currentPhase === 'break' ? 'text-orange-500' : 'text-gray-300'}`}
                stroke-width={ringStroke}
                stroke-linecap="round"
                fill="none"
                style={`stroke-dasharray: ${ringCirc * progress()}, ${ringCirc}; transition: stroke-dasharray 0.25s linear;`}
              />
            </g>
          </svg>
        {/key}
        <div class="absolute inset-0 grid place-items-center">
          <div class="text-center select-none">
            <div class="text-6xl font-mono font-bold text-gray-900 tabular-nums" aria-live="polite">{formatTime}</div>
            <div class="text-sm mt-1 text-gray-500">{phaseLabel}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Controls -->
    <div class="grid grid-cols-2 gap-3">
      {#if currentPhase === 'idle'}
        <button
          onclick={startFocus}
          class="col-span-2 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-semibold py-3 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
          title="Start focus (Space)"
        >Start Focus</button>
      {:else}
        {#if running()}
          <button
            onclick={pause}
            class="bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-semibold py-3 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2"
            title="Pause (Space)"
          >Pause</button>
        {:else}
          <button
            onclick={resume}
            class="bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-semibold py-3 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
            title="Resume (Space)"
          >Resume</button>
        {/if}
        <button
          onclick={reset}
          class="bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-900 font-medium py-3 rounded-lg transition-colors border border-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
          title={currentPhase === 'break' ? 'End break early (Esc)' : 'Reset (Esc)'}
        >{currentPhase === 'break' ? 'End Break Early' : 'Reset'}</button>
      {/if}
    </div>

    <div class="mt-3 text-center text-xs text-gray-500">
      <span>Space: start/pause/resume</span>
      <span class="mx-2">•</span>
      <span>Esc: {currentPhase === 'break' ? 'end break' : 'reset'}</span>
      <span class="mx-2">•</span>
      <span>B: start break</span>
    </div>

    <!-- Settings -->
    {#if currentPhase === 'idle'}
      <div class="mt-8 pt-6 border-t border-gray-100">
        <details class="group">
          <summary class="list-none cursor-pointer select-none flex items-center justify-between py-2">
            <span class="text-lg font-semibold text-gray-800">Session Settings</span>
            <span class="text-gray-500 group-open:rotate-180 transition-transform">▾</span>
          </summary>

          <div class="mt-4 space-y-6">
            <div class="space-y-2">
              <label class="text-sm font-medium text-gray-600">Presets</label>
              <div class="flex flex-wrap gap-2">
                <button onclick={() => applyPreset(25, 5)} class="px-3 py-1.5 text-sm rounded-md bg-gray-100 hover:bg-gray-200 text-gray-800 transition-colors" title="25 min focus / 5 min break">Pomodoro (25/5)</button>
                <button onclick={() => applyPreset(50, 10)} class="px-3 py-1.5 text-sm rounded-md bg-gray-100 hover:bg-gray-200 text-gray-800 transition-colors" title="50 min focus / 10 min break">Long (50/10)</button>
                <button onclick={() => applyPreset(15, 3)} class="px-3 py-1.5 text-sm rounded-md bg-gray-100 hover:bg-gray-200 text-gray-800 transition-colors" title="15 min focus / 3 min break">Quick (15/3)</button>
              </div>
            </div>

            <div class="space-y-2">
              <label class="text-sm font-medium text-gray-600">Focus Duration</label>
              <div class="flex items-center gap-2 flex-wrap">
                <div class="flex gap-2">
                  {#each [10, 15, 25, 45, 60] as minutes}
                    <button onclick={() => setFocusDuration(minutes)} class="px-3 py-1.5 text-sm rounded-md transition-colors {focusDurationSec === minutes * 60 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}">{minutes}m</button>
                  {/each}
                </div>
                <span class="text-gray-400">or</span>
                <div class="flex items-center gap-1">
                  <input
                    type="number"
                    min="0.1"
                    max="180"
                    step="0.1"
                    placeholder="Custom"
                    class="w-24 px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    onkeydown={(e) => {
                      if (e.key === 'Enter') {
                        const target = e.target as HTMLInputElement;
                        const value = parseFloat(target.value);
                        if (value && value > 0 && value <= 180) {
                          setFocusDuration(value);
                          target.value = '';
                          target.blur();
                        }
                      }
                    }}
                    onchange={(e) => {
                      const target = e.target as HTMLInputElement;
                      const value = parseFloat(target.value);
                      if (value && value > 0 && value <= 180) {
                        setFocusDuration(value);
                        target.value = '';
                      }
                    }}
                  />
                  <span class="text-xs text-gray-500">min</span>
                </div>
              </div>
              <div class="text-xs text-gray-500">Current: {(focusDurationSec / 60).toFixed(1)} minutes</div>
            </div>

            <div class="space-y-2">
              <label class="text-sm font-medium text-gray-600">Break Duration</label>
              <div class="flex items-center gap-2 flex-wrap">
                <div class="flex gap-2">
                  {#each [3, 5, 10, 15] as minutes}
                    <button onclick={() => setBreakDuration(minutes)} class="px-3 py-1.5 text-sm rounded-md transition-colors {breakDurationSec === minutes * 60 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}">{minutes}m</button>
                  {/each}
                </div>
                <span class="text-gray-400">or</span>
                <div class="flex items-center gap-1">
                  <input
                    type="number"
                    min="0.1"
                    max="60"
                    step="0.1"
                    placeholder="Custom"
                    class="w-24 px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    onkeydown={(e) => {
                      if (e.key === 'Enter') {
                        const target = e.target as HTMLInputElement;
                        const value = parseFloat(target.value);
                        if (value && value > 0 && value <= 60) {
                          setBreakDuration(value);
                          target.value = '';
                          target.blur();
                        }
                      }
                    }}
                    onchange={(e) => {
                      const target = e.target as HTMLInputElement;
                      const value = parseFloat(target.value);
                      if (value && value > 0 && value <= 60) {
                        setBreakDuration(value);
                        target.value = '';
                      }
                    }}
                  />
                  <span class="text-xs text-gray-500">min</span>
                </div>
              </div>
              <div class="text-xs text-gray-500">Current: {(breakDurationSec / 60).toFixed(1)} minutes</div>
            </div>
          </div>
        </details>
      </div>
    {/if}
  </div>
</main>
