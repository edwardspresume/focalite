<script lang="ts">
  import BreakView from '$lib/components/BreakView.svelte';
  import TimerView from '$lib/components/TimerView.svelte';

  type TimerPhase = 'focus' | 'break' | 'idle';

  let focusDurationSec = $state(30 * 60);
  let breakDurationSec = $state(3 * 60);
  let currentPhase: TimerPhase = $state('idle');
  let startedAt: number | null = $state(null);
  let now = $state(Date.now());
  let baseElapsedSec = $state(0);
  let sessionsCompleted = $state(0);
  let totalFocusTime = $state(0);
  let breaksCompleted = $state(0);
  let autoLoop = $state(false);

  const currentDuration = $derived(
    (currentPhase as TimerPhase) === 'focus' ? focusDurationSec :
    (currentPhase as TimerPhase) === 'break' ? breakDurationSec : 0
  );

  const elapsed = $derived((startedAt ? Math.floor((now - startedAt) / 1000) : 0) + baseElapsedSec);
  const remaining = $derived(Math.max(currentDuration - elapsed, 0));
  const running = $derived(startedAt !== null && remaining > 0);
  const isTimerComplete = $derived(startedAt !== null && remaining === 0);

  const phaseLabel = $derived(
    currentPhase === 'idle' ? 'Ready to Focus' :
    currentPhase === 'focus' ? (running ? 'Focus Time' : 'Focus Paused') :
    running ? 'Break Time' : 'Break Paused'
  );

  // Display helpers
  const timeLabel = $derived.by(() => {
    const secs = Math.max(remaining, 0);
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}:${String(s).padStart(2, '0')}`;
  });

  // 2 * Math.PI * r with r=45, rounded to match template usage
  const CIRC = 283;
  const dashOffset = $derived.by(() => {
    if (currentPhase === 'idle') return CIRC;
    const totalTime = currentPhase === 'focus' ? focusDurationSec : breakDurationSec;
    const ratio = totalTime > 0 ? (totalTime - remaining) / totalTime : 0;
    return Math.max(CIRC - ratio * CIRC, 0);
  });

  $effect(() => {
    if (!running) return;
    const id = setInterval(() => { now = Date.now(); }, 250);
    return () => clearInterval(id);
  });

  $effect(() => {
    if (!isTimerComplete) return;

    if (currentPhase === 'focus') {
      sessionsCompleted++;
      totalFocusTime += Math.floor(focusDurationSec / 60);
      startBreak();
    } else if (currentPhase === 'break') {
      handleEndBreak();
    }
  });

  $effect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.code === 'Space') {
        e.preventDefault();
        if (currentPhase === 'idle') startFocus();
        else if (running) pause();
        else resume();
      } else if (e.key === 'Escape') {
        reset();
      } else if (e.key === 'b' || e.key === 'B') {
        if (currentPhase !== 'break') startBreak();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  async function playSound(filename: string, volume = 1) {
    try {
      let audioPath = `/${filename}`;
      if (typeof window !== 'undefined' && '__TAURI__' in window) {
        const { convertFileSrc } = await import('@tauri-apps/api/core');
        audioPath = convertFileSrc(filename);
      }
      const audio = new Audio(audioPath);
      audio.volume = volume;
      await audio.play().catch(() => {/* ignore autoplay errors */});
    } catch {
      // noop — optional sound
    }
  }

  function startFocus() {
    if (running) return;
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

    // Add a small delay to ensure UI transition is complete
    setTimeout(() => {
      playSound('break-start.mp3', 1.0);
    }, 100);
  }

  function pause() {
    if (!startedAt) return;
    baseElapsedSec = elapsed;
    startedAt = null;
  }

  function resume() {
    if (startedAt || currentPhase === 'idle') return;
    startedAt = Date.now();
    now = startedAt;
  }

  function reset() {
    currentPhase = 'idle';
    startedAt = null;
    baseElapsedSec = 0;
  }

  function handleEndBreak(manual = false) {
    playSound('break-complete.mp3', 1.0);
    breaksCompleted++;
    if (autoLoop && !manual) {
      startFocus();
    } else {
      reset();
    }
  }

  function setFocusDuration(minutes: number) {
    if (!running) focusDurationSec = minutes * 60;
  }

  function setBreakDuration(minutes: number) {
    if (!running) breakDurationSec = minutes * 60;
  }

  function endBreakEarly() {
    handleEndBreak(true);
  }

</script>

<main class="p-6">
  <header class="text-center space-y-2 mb-8">
    <h1 class="text-4xl font-bold">Focalite</h1>
    <p class="text-muted-foreground text-lg">
      Focus timer with enforced breaks
    </p>
  </header>

  {#if currentPhase === 'break'}
    <BreakView {timeLabel} {phaseLabel} {dashOffset} {pause} {resume} handleEndBreak={endBreakEarly} {running} />
  {:else}
    <TimerView
      {currentPhase}
      {running}
      {timeLabel}
      {phaseLabel}
      {dashOffset}
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
      bind:autoLoop
    />
  {/if}
</main>
