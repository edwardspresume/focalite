<script lang="ts">
  import Button from '$lib/components/ui/button/button.svelte';
  import TimerSettings from '$lib/components/TimerSettings.svelte';
  import {
    ChartBar,
    Pause,
    Play,
    Square,
  } from '@lucide/svelte';

  type TimerProps = {
    currentPhase: 'focus' | 'break' | 'idle';
    running: boolean;
    timeLabel: string;
    phaseLabel: string;
    dashOffset: number;
    startFocus: () => void;
    pause: () => void;
    resume: () => void;
    reset: () => void;
    focusDurationSec: number;
    breakDurationSec: number;
    setFocusDuration: (minutes: number) => void;
    setBreakDuration: (minutes: number) => void;
    sessionsCompleted: number;
    totalFocusTime: number;
    breaksCompleted: number;
    autoLoop: boolean;
    setAutoLoop: (enabled: boolean) => void;
  };

  let {
    currentPhase,
    running,
    timeLabel,
    phaseLabel,
    dashOffset,
    startFocus,
    pause,
    resume,
    reset,
    focusDurationSec,
    breakDurationSec,
    setFocusDuration,
    setBreakDuration,
    sessionsCompleted,
    totalFocusTime,
    breaksCompleted,
    autoLoop,
    setAutoLoop,
  }: TimerProps = $props();

  const buttonText = $derived(
    currentPhase === 'idle' ? 'Start Focus Session' :
    running ? 'Pause' : 'Resume'
  );

  const ButtonIcon = $derived(currentPhase === 'idle' || !running ? Play : Pause);
</script>

<div class="max-w-4xl mx-auto space-y-8">
  <!-- Main Timer section -->
  <section
    class="bg-accent border rounded-xl p-8 shadow-lg gap-6 flex flex-col items-center"
  >
    <!-- Timer Display -->
    <div class="size-64 relative">
      <svg class="size-full transform -rotate-90" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r="45"
          stroke="currentColor"
          stroke-width="2"
          fill="none"
          class={currentPhase === 'idle' ? 'text-primary' : 'text-border'}
        />
        <circle
          cx="50"
          cy="50"
          r="45"
          stroke="currentColor"
          stroke-width="3"
          fill="none"
          stroke-dasharray="283"
          stroke-dashoffset={dashOffset}
          class="text-primary transition-all duration-1000 ease-linear"
          stroke-linecap="round"
        />
      </svg>

      <div class="absolute inset-0 flex flex-col items-center justify-center">
        <div class="text-6xl font-mono font-bold text-foreground">
          {timeLabel}
        </div>
        <div class="text-muted-foreground text-sm mt-2">{phaseLabel}</div>
      </div>
    </div>

    <!-- Control Buttons -->
    <div class="flex gap-4">
      <Button
        size="lg"
        onclick={() => currentPhase === 'idle' ? startFocus() : (running ? pause() : resume())}
        class="text-lg font-semibold shadow-lg hover:shadow-xl cursor-pointer"
      >
        <ButtonIcon class="size-4" />
        {buttonText}
      </Button>

      {#if currentPhase !== 'idle'}
        <Button
          size="lg"
          variant="outline"
          onclick={reset}
          class="text-lg font-semibold cursor-pointer"
        >
          <Square class="size-4" />
          Reset
        </Button>
      {/if}
    </div>

    <div class="flex gap-6 text-sm text-muted-foreground">
      <span>
        <kbd
          class="px-1.5 py-0.5 bg-border text-foreground rounded text-xs font-mono"
          >Space</kbd
        >
        start/pause/resume
      </span>
      <span>
        <kbd
          class="px-1.5 py-0.5 bg-border text-foreground rounded text-xs font-mono"
          >Esc</kbd
        > reset
      </span>
      <span>
        <kbd
          class="px-1.5 py-0.5 bg-border text-foreground rounded text-xs font-mono"
          >B</kbd
        > start break
      </span>
    </div>
  </section>

  <!-- Settings Panel -->
  <TimerSettings
    {currentPhase}
    {focusDurationSec}
    {breakDurationSec}
    {setFocusDuration}
    {setBreakDuration}
    {autoLoop}
    {setAutoLoop}
  />

  <!-- Stats Preview -->
  <section class="bg-accent border rounded-xl p-8 shadow-lg space-y-6">
    <h2 class="flex items-center gap-2 text-foreground text-xl font-semibold">
      <ChartBar class="size-5" />
      Today's Progress
    </h2>
    <div class="grid grid-cols-3 gap-4 text-center">
      <div class="space-y-1">
        <div class="text-2xl font-bold text-primary">{sessionsCompleted}</div>
        <div class="text-sm text-muted-foreground">Sessions</div>
      </div>
      <div class="space-y-1">
        <div class="text-2xl font-bold text-primary">
          {Math.floor(totalFocusTime / 60)}h {totalFocusTime % 60}m
        </div>
        <div class="text-sm text-muted-foreground">Focused</div>
      </div>
      <div class="space-y-1">
        <div class="text-2xl font-bold text-primary">{breaksCompleted}</div>
        <div class="text-sm text-muted-foreground">Breaks</div>
      </div>
    </div>
  </section>
</div>
