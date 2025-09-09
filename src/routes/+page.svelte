<script lang="ts">
  import { invoke } from '@tauri-apps/api/core';

  type TimerPhase = 'focus' | 'break' | 'idle';

  // Base state
  let focusDurationSec = $state(25 * 60); // 25 minutes
  let breakDurationSec = $state(5 * 60); // 5 minutes
  let currentPhase: TimerPhase = $state('idle');
  let startedAt: number | null = $state(null);
  let now = $state(Date.now());

  // Derived state
  const currentDuration = $derived(() =>
    currentPhase === 'focus'
      ? focusDurationSec
      : currentPhase === 'break'
        ? breakDurationSec
        : 0
  );
  const elapsed = $derived(() =>
    startedAt ? Math.floor((now - startedAt) / 1000) : 0
  );
  const remaining = $derived(() => Math.max(currentDuration() - elapsed(), 0));
  const running = $derived(() => startedAt !== null && remaining() > 0);
  const isTimerComplete = $derived(
    () => startedAt !== null && remaining() === 0
  );

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
    }
  });

  async function startFocus() {
    if (running()) return;

    currentPhase = 'focus';
    startedAt = Date.now();
    now = startedAt;
  }

  async function startBreak() {
    currentPhase = 'break';
    startedAt = Date.now();
    now = startedAt;

    // Make window fullscreen and always on top for break mode
    try {
      await invoke('enter_break_mode');
    } catch (error) {
      console.error('Failed to enter break mode:', error);
    }
  }

  async function stop() {
    if (currentPhase === 'break') {
      await exitBreakMode();
    }
    currentPhase = 'idle';
    startedAt = null;
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

</script>

<main
  class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-8"
>
  <div class="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
    <!-- Header -->
    <div class="text-center mb-8">
      <h1 class="text-3xl font-bold text-gray-800 mb-2">Focalite</h1>
      <p class="text-gray-600">Focus Timer with Enforced Breaks</p>
    </div>

    <!-- Timer Display -->
    <div class="text-center mb-8">
      <div
        class="text-6xl font-mono font-bold text-gray-800 mb-2"
        aria-live="polite"
      >
        {formatTime}
      </div>
      <div class="text-lg capitalize text-gray-600">
        {currentPhase === 'idle'
          ? 'Ready to Focus'
          : currentPhase === 'focus'
            ? 'Focus Time'
            : 'Break Time'}
      </div>
    </div>

    <!-- Controls -->
    <div class="space-y-4">
      {#if currentPhase === 'idle'}
        <button
          onclick={startFocus}
          class="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
        >
          Start Focus Session
        </button>
      {:else if currentPhase === 'focus'}
        <button
          onclick={stop}
          class="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
        >
          Stop Focus
        </button>
      {:else}
        <!-- Break Mode UI -->
        <div class="text-center space-y-4">
          <div class="text-center mb-6">
            <div class="text-6xl mb-4">🛌</div>
            <h2 class="text-2xl font-bold text-orange-600 mb-2">Break Time!</h2>
            <p class="text-gray-600">Time to rest your eyes and mind</p>
          </div>
          
          <button
            onclick={stop}
            class="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            End Break Early
          </button>
        </div>
      {/if}
    </div>

    <!-- Settings -->
    {#if currentPhase === 'idle'}
      <div class="mt-8 pt-6 border-t border-gray-200">
        <h3 class="text-lg font-semibold text-gray-700 mb-4">Settings</h3>

        <div class="space-y-4">
          <!-- Focus Duration -->
          <div class="space-y-2">
            <label class="text-sm font-medium text-gray-600"
              >Focus Duration</label
            >
            <div class="flex items-center gap-2 flex-wrap">
              <div class="flex gap-2">
                {#each [0.1, 25, 45, 60] as minutes}
                  <button
                    onclick={() => setFocusDuration(minutes)}
                    class="px-3 py-1 text-sm rounded-md transition-colors
                      {focusDurationSec === minutes * 60
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
                  >
                    {minutes}m
                  </button>
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
                  class="w-20 px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  onkeydown={(e) => {
                    if (e.key === 'Enter') {
                      const target = e.target as HTMLInputElement;
                      const value = parseFloat(target.value);
                      console.log(
                        `Custom focus input: ${target.value} -> ${value}`
                      );
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
                    console.log(
                      `Custom focus change: ${target.value} -> ${value}`
                    );
                    if (value && value > 0 && value <= 180) {
                      setFocusDuration(value);
                      target.value = '';
                    }
                  }}
                />
                <span class="text-xs text-gray-500">min</span>
              </div>
            </div>
            <div class="text-xs text-gray-500">
              Current: {(focusDurationSec / 60).toFixed(1)} minutes
            </div>
          </div>

          <!-- Break Duration -->
          <div class="space-y-2">
            <label class="text-sm font-medium text-gray-600"
              >Break Duration</label
            >
            <div class="flex items-center gap-2 flex-wrap">
              <div class="flex gap-2">
                {#each [5, 10, 15] as minutes}
                  <button
                    onclick={() => setBreakDuration(minutes)}
                    class="px-3 py-1 text-sm rounded-md transition-colors
                      {breakDurationSec === minutes * 60
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
                  >
                    {minutes}m
                  </button>
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
                  class="w-20 px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
            <div class="text-xs text-gray-500">
              Current: {(breakDurationSec / 60).toFixed(1)} minutes
            </div>
          </div>
        </div>
      </div>
    {/if}
  </div>
</main>
