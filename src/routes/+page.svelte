<script lang="ts">
  import BreakView from '$lib/components/BreakView.svelte';
  import TimerView from '$lib/components/TimerView.svelte';

  type TimerPhase = 'focus' | 'break' | 'idle';

  // Base state
  let focusDurationSec = $state(25 * 60); // 25 minutes
  let breakDurationSec = $state(5 * 60); // 5 minutes
  let currentPhase: TimerPhase = $state('idle');
  let startedAt: number | null = $state(null);
  let now = $state(Date.now());
  let baseElapsedSec = $state(0);
  let sessionsCompleted = $state(0);
  let totalFocusTime = $state(0);
  let breaksCompleted = $state(0);

  // Derived state
  const currentDuration = $derived(() =>
    currentPhase === 'focus'
      ? focusDurationSec
      : currentPhase === 'break'
        ? breakDurationSec
        : 0
  );
  const elapsed = $derived(
    () =>
      (startedAt ? Math.floor((now - startedAt) / 1000) : 0) + baseElapsedSec
  );
  const remaining = $derived(() => Math.max(currentDuration() - elapsed(), 0));
  const running = $derived(() => startedAt !== null && remaining() > 0);
  const isTimerComplete = $derived(
    () => startedAt !== null && remaining() === 0
  );

  const phaseLabel = $derived.by(() =>
    currentPhase === 'idle'
      ? 'Ready to Focus'
      : currentPhase === 'focus'
        ? running()
          ? 'Focus Time'
          : 'Focus Paused'
        : running()
          ? 'Break Time'
          : 'Break Paused'
  );

  // Progress ring constants - matching React version
  const ringCirc = 2 * Math.PI * 45;

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
      // Focus session completed, start break
      sessionsCompleted++;
      totalFocusTime += Math.floor(focusDurationSec / 60);
      startBreak();
    } else if (currentPhase === 'break') {
      // Break completed, play sound and return to idle
      playBreakCompleteSound();
      breaksCompleted++;
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

  function startBreak() {
    currentPhase = 'break';
    baseElapsedSec = 0;
    startedAt = Date.now();
    now = startedAt;
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

  function reset() {
    currentPhase = 'idle';
    startedAt = null;
    baseElapsedSec = 0;
  }

  function handleEndBreak() {
    playBreakCompleteSound();
    reset();
    breaksCompleted++;
  }

  async function playBreakCompleteSound() {
    try {
      // Check if we're in Tauri (desktop app)
      if (typeof window !== 'undefined' && '__TAURI__' in window) {
        // Use Tauri's asset API to get the correct path
        const { convertFileSrc } = await import('@tauri-apps/api/core');
        const audioPath = convertFileSrc('break-complete.mp3');
        const audio = new Audio(audioPath);
        audio.volume = 0.7; // Set volume to 70%
        audio.play().catch(error => {
          console.warn('Failed to play break complete sound:', error);
        });
      } else {
        // Web app - use static path
        const audio = new Audio('/break-complete.mp3');
        audio.volume = 0.7; // Set volume to 70%
        audio.play().catch(error => {
          console.warn('Failed to play break complete sound:', error);
        });
      }
    } catch (error) {
      console.warn('Failed to create audio element:', error);
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

  const getProgress = () => {
    if (currentPhase === 'idle') return 0;
    const totalTime =
      currentPhase === 'focus' ? focusDurationSec : breakDurationSec;
    return ((totalTime - remaining()) / totalTime) * ringCirc;
  };

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

<main class='py-10'>

  <header class="text-center space-y-2 mb-8">
    <h1 class="text-4xl font-bold">Focalite</h1>
    <p class="text-muted-foreground text-lg">Focus timer with enforced breaks</p>
  </header>


  {#if currentPhase === 'break'}
    <BreakView
      {formatTime}
      {phaseLabel}
      {getProgress}
      {pause}
      {handleEndBreak}
    />
  {:else}
    <TimerView
      {currentPhase}
      running={running()}
      {formatTime}
      {phaseLabel}
      {getProgress}
      {startFocus}
      {pause}
      {resume}
      {reset}
      {focusDurationSec}
      {breakDurationSec}
      {setFocusDuration}
      {setBreakDuration}
      {sessionsCompleted}
      {totalFocusTime}
      {breaksCompleted}
    />
  {/if}
</main>
