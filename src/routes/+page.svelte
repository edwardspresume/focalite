<script lang="ts">
  import BreakView from '$lib/components/BreakView.svelte';
  import TimerView from '$lib/components/TimerView.svelte';

  type TimerPhase = 'focus' | 'break' | 'idle';

  let focusDurationSec = $state(25 * 60);
  let breakDurationSec = $state(5 * 60);
  let currentPhase: TimerPhase = $state('idle');
  let startedAt: number | null = $state(null);
  let now = $state(Date.now());
  let baseElapsedSec = $state(0);
  let sessionsCompleted = $state(0);
  let totalFocusTime = $state(0);
  let breaksCompleted = $state(0);

  const currentDuration = $derived(
    (currentPhase as string) === 'focus' ? focusDurationSec :
    (currentPhase as string) === 'break' ? breakDurationSec : 0
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
  
  const formatTime = $derived(() => {
    const mins = Math.floor(remaining / 60);
    const secs = remaining % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  });

  const getProgress = $derived(() => {
    if (currentPhase === 'idle') return 0;
    const totalTime = currentPhase === 'focus' ? focusDurationSec : breakDurationSec;
    return ((totalTime - remaining) / totalTime) * (2 * Math.PI * 45);
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
    if (typeof window === 'undefined') return;
    
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
      let audioPath: string;
      
      if (typeof window !== 'undefined' && '__TAURI__' in window) {
        const { convertFileSrc } = await import('@tauri-apps/api/core');
        audioPath = convertFileSrc(filename);
      } else {
        audioPath = `/${filename}`;
      }
      
      console.log(`Attempting to play sound: ${filename} at volume ${volume} from path: ${audioPath}`);
      
      const audio = new Audio(audioPath);
      audio.volume = volume;
      
      // Add error and success event listeners for debugging
      audio.addEventListener('error', (e) => {
        console.error(`Audio error for ${filename}:`, e);
      });
      
      audio.addEventListener('canplaythrough', () => {
        console.log(`Audio ${filename} can play through`);
      });
      
      // Try to play the audio
      try {
        await audio.play();
        console.log(`Successfully started playing ${filename}`);
      } catch (playError) {
        console.warn(`Failed to play ${filename}:`, playError);
        
        // If autoplay is blocked, try to play with user interaction
        if (playError.name === 'NotAllowedError') {
          console.log(`Autoplay blocked for ${filename}, will try again on next user interaction`);
        }
      }
    } catch (error) {
      console.warn(`Failed to create audio for ${filename}:`, error);
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

  function handleEndBreak() {
    playSound('break-complete.mp3', 1.0);
    reset();
    breaksCompleted++;
  }

  function setFocusDuration(minutes: number) {
    if (!running) focusDurationSec = minutes * 60;
  }

  function setBreakDuration(minutes: number) {
    if (!running) breakDurationSec = minutes * 60;
  }
</script>

<main class="py-10">
  <header class="text-center space-y-2 mb-8">
    <h1 class="text-4xl font-bold">Focalite</h1>
    <p class="text-muted-foreground text-lg">
      Focus timer with enforced breaks
    </p>
  </header>

  {#if currentPhase === 'break'}
    <BreakView {formatTime} {phaseLabel} {getProgress} {pause} {resume} {handleEndBreak} {running} />
  {:else}
    <TimerView 
      {currentPhase}
      {running}
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
