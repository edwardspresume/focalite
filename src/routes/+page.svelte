<script lang="ts">
  import BreakView from '$lib/components/BreakView.svelte';
  import TimerView from '$lib/components/TimerView.svelte';
  import {
    loadPreferences,
    saveAutoLoop,
    saveBreakDuration,
    saveFocusDuration,
  } from '$lib/stores/preferences';
  import {
    getLocalDateString,
    loadTodayProgress,
    resetAndSaveForToday,
    saveTodayProgress,
    saveTodayProgressThrottled,
    type DailyProgress,
  } from '$lib/stores/progress';

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
  let totalBreakTime = $state(0);
  let autoLoop = $state(false);
  let preferencesLoaded = $state(false);
  let progressLoaded = $state(false);
  let progressDate = $state(''); // YYYY-MM-DD for the persisted record

  const currentDuration = $derived.by(() => {
    if (currentPhase === 'focus') return focusDurationSec;
    if (currentPhase === 'break') return breakDurationSec;
    return 0;
  });

  const elapsed = $derived(
    (startedAt ? Math.floor((now - startedAt) / 1000) : 0) + baseElapsedSec
  );
  const remaining = $derived(Math.max(currentDuration - elapsed, 0));
  const running = $derived(startedAt !== null && remaining > 0);
  const isTimerComplete = $derived(startedAt !== null && remaining === 0);

  const phaseLabel = $derived(
    currentPhase === 'idle'
      ? 'Ready to Focus'
      : currentPhase === 'focus'
        ? running
          ? 'Focus Time'
          : 'Focus Paused'
        : running
          ? 'Break Time'
          : 'Break Paused'
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
    const totalTime =
      currentPhase === 'focus' ? focusDurationSec : breakDurationSec;
    const ratio = totalTime > 0 ? (totalTime - remaining) / totalTime : 0;
    return Math.max(CIRC - ratio * CIRC, 0);
  });

  // Load preferences once on component initialization
  $effect(() => {
    if (preferencesLoaded) return;

    loadPreferences().then((preferences) => {
      focusDurationSec = preferences.focusDurationMin * 60;
      breakDurationSec = preferences.breakDurationMin * 60;
      autoLoop = preferences.autoLoop;
      preferencesLoaded = true;
    });
  });

  // Load today's progress once on component initialization
  $effect(() => {
    if (progressLoaded) return;
    loadTodayProgress().then((p) => {
      progressDate = p.date;
      sessionsCompleted = p.sessionsCompleted;
      breaksCompleted = p.breaksCompleted;
      totalFocusTime = p.focusMinutes;
      totalBreakTime = p.breakMinutes;
      progressLoaded = true;
    });
  });

  function setAutoLoop(enabled: boolean) {
    autoLoop = enabled;
    saveAutoLoop(enabled).catch(console.error);
  }

  $effect(() => {
    if (!running) return;
    const id = setInterval(() => {
      now = Date.now();

      // Detect midnight rollover (local time) and start a fresh record
      const today = getLocalDateString(new Date());
      if (progressDate && progressDate !== today) {
        progressDate = today;
        sessionsCompleted = 0;
        breaksCompleted = 0;
        totalFocusTime = 0;
        totalBreakTime = 0;
        // Persist fresh record for the new day
        resetAndSaveForToday().catch(console.warn);
      }

      // Throttled persistence of today's totals while running
      if (progressLoaded && progressDate) {
        const snapshot: DailyProgress = {
          date: progressDate,
          sessionsCompleted,
          breaksCompleted,
          focusMinutes: totalFocusTime,
          breakMinutes: totalBreakTime,
        };
        saveTodayProgressThrottled(snapshot, 15000).catch(() => {});
      }
    }, 250);
    return () => clearInterval(id);
  });


  $effect(() => {
    if (!isTimerComplete) return;

    if (currentPhase === 'focus') {
      sessionsCompleted++;
      totalFocusTime += Math.floor(focusDurationSec / 60);
      // Persist on meaningful change (session end)
      updateProgress();
      startBreak();
    } else if (currentPhase === 'break') {
      handleEndBreak();
    }
  });

  function handleKeydown(e: KeyboardEvent) {
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

  async function playSound(filename: string, volume = 1) {
    try {
      let audioPath = `/${filename}`;
      if (typeof window !== 'undefined' && '__TAURI__' in window) {
        const { convertFileSrc } = await import('@tauri-apps/api/core');
        audioPath = convertFileSrc(filename);
      }
      const audio = new Audio(audioPath);
      audio.volume = volume;
      await audio.play().catch(() => {
        /* ignore autoplay errors */
      });
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
    // Add break minutes (full duration or elapsed if ended early)
    const addBreakMin = manual
      ? Math.floor(elapsed / 60)
      : Math.floor(breakDurationSec / 60);
    totalBreakTime += addBreakMin;

    // Persist on meaningful change (break end)
    updateProgress();

    if (autoLoop && !manual) {
      startFocus();
    } else {
      reset();
    }
  }

  function setFocusDuration(minutes: number) {
    if (!running) {
      focusDurationSec = minutes * 60;
      saveFocusDuration(minutes).catch(console.error);
    }
  }

  function setBreakDuration(minutes: number) {
    if (!running) {
      breakDurationSec = minutes * 60;
      saveBreakDuration(minutes).catch(console.error);
    }
  }

  function endBreakEarly() {
    handleEndBreak(true);
  }

  function updateProgress() {
    if (!progressDate) return;

    const progress: DailyProgress = {
      date: progressDate,
      sessionsCompleted,
      breaksCompleted,
      focusMinutes: totalFocusTime,
      breakMinutes: totalBreakTime,
    };

    saveTodayProgress(progress).catch(console.warn);
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<main class="p-6">
  <header class="text-center space-y-2 mb-8">
    <h1 class="text-4xl font-bold">Focalite</h1>
    <p class="text-muted-foreground text-lg">
      Focus timer with enforced breaks
    </p>
  </header>

  {#if currentPhase === 'break'}
    <BreakView
      {timeLabel}
      {phaseLabel}
      {dashOffset}
      {pause}
      {resume}
      handleEndBreak={endBreakEarly}
      {running}
    />
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
      {autoLoop}
      {setAutoLoop}
    />
  {/if}
</main>
