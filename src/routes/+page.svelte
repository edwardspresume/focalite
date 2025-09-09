<script lang="ts">
  import { invoke } from '@tauri-apps/api/core';
  import { listen } from '@tauri-apps/api/event';
  import { onMount } from 'svelte';

  type TimerPhase = 'focus' | 'break' | 'idle';

  // Base state
  let focusDurationSec = $state(25 * 60); // 25 minutes
  let breakDurationSec = $state(5 * 60); // 5 minutes
  let currentPhase: TimerPhase = $state('idle');
  let startedAt: number | null = $state(null);
  let now = $state(Date.now());

  // Derived state
  const currentDuration = $derived(() => 
    currentPhase === 'focus' ? focusDurationSec :
    currentPhase === 'break' ? breakDurationSec : 0
  );
  const elapsed = $derived(() => startedAt ? Math.floor((now - startedAt) / 1000) : 0);
  const remaining = $derived(() => Math.max(currentDuration() - elapsed(), 0));
  const running = $derived(() => startedAt !== null && remaining() > 0);
  const isTimerComplete = $derived(() => startedAt !== null && remaining() === 0);

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
      currentPhase = 'idle';
      startedAt = null;
      closeBreakOverlays();
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

    // Store break end time for overlay windows
    const breakEndTime = startedAt + (breakDurationSec * 1000);
    localStorage.setItem('breakEndTime', breakEndTime.toString());

    // Create fullscreen overlay windows on all monitors
    try {
      console.log('Creating break overlays...');
      await invoke('create_break_overlays');
      console.log('Break overlays created successfully');
    } catch (error) {
      console.error('Failed to create break overlays:', error);
      // Don't let the error stop the break phase
      alert(`Error creating break overlay: ${error}`);
    }
  }

  async function stop() {
    if (currentPhase === 'break') {
      await closeBreakOverlays();
    }
    currentPhase = 'idle';
    startedAt = null;
  }

  async function closeBreakOverlays() {
    try {
      await invoke('close_break_overlays');
    } catch (error) {
      console.error('Failed to close break overlays:', error);
    }
  }

  function setFocusDuration(minutes: number) {
    if (!running()) {
      focusDurationSec = minutes * 60;
    }
  }

  function setBreakDuration(minutes: number) {
    if (!running()) {
      breakDurationSec = minutes * 60;
    }
  }

  // Listen for break end events from overlay windows
  onMount(() => {
    const unlisten = listen('break_ended', () => {
      currentPhase = 'idle';
      startedAt = null;
      localStorage.removeItem('breakEndTime');
    });

    return () => {
      unlisten.then(fn => fn());
    };
  });
</script>

<main class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-8">
  <div class="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
    <!-- Header -->
    <div class="text-center mb-8">
      <h1 class="text-3xl font-bold text-gray-800 mb-2">Focalite</h1>
      <p class="text-gray-600">Focus Timer with Enforced Breaks</p>
    </div>

    <!-- Timer Display -->
    <div class="text-center mb-8">
      <div class="text-6xl font-mono font-bold text-gray-800 mb-2" aria-live="polite">
        {formatTime}
      </div>
      <div class="text-lg capitalize text-gray-600">
        {currentPhase === 'idle' ? 'Ready to Focus' :
         currentPhase === 'focus' ? 'Focus Time' : 'Break Time'}
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
        <div class="text-center text-orange-600 font-semibold">
          Break in progress - overlay windows active
        </div>
      {/if}
    </div>

    <!-- Settings -->
    {#if currentPhase === 'idle'}
      <div class="mt-8 pt-6 border-t border-gray-200">
        <h3 class="text-lg font-semibold text-gray-700 mb-4">Settings</h3>

        <div class="space-y-4">
          <!-- Focus Duration -->
          <div class="flex items-center justify-between">
            <label class="text-sm font-medium text-gray-600">Focus Duration</label>
            <div class="flex gap-2">
              {#each [.1, 25, 45, 60] as minutes}
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
          </div>

          <!-- Break Duration -->
          <div class="flex items-center justify-between">
            <label class="text-sm font-medium text-gray-600">Break Duration</label>
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
          </div>
        </div>
      </div>
    {/if}
  </div>
</main>
