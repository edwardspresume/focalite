<script lang="ts">
  import Button from '$lib/components/ui/button/button.svelte';
  import CardContent from '$lib/components/ui/card/card-content.svelte';
  import CardHeader from '$lib/components/ui/card/card-header.svelte';
  import CardTitle from '$lib/components/ui/card/card-title.svelte';
  import Card from '$lib/components/ui/card/card.svelte';
  import Input from '$lib/components/ui/input/input.svelte';
  import {
    BarChart3,
    Clock,
    Pause,
    Play,
    Settings,
    Square,
    Target,
  } from '@lucide/svelte';

  type TimerProps = {
    currentPhase: 'focus' | 'break' | 'idle';
    running: boolean;
    formatTime: string;
    phaseLabel: string;
    getProgress: () => number;
    startFocus: () => void;
    pause: () => void;
    resume: () => void;
    reset: () => void;
    focusDurationSec: number;
    breakDurationSec: number;
    setFocusDuration: (minutes: number) => void;
    setBreakDuration: (minutes: number) => void;
    customFocus: string;
    customBreak: string;
    sessionsCompleted: number;
    totalFocusTime: number;
    breaksCompleted: number;
  };

  let {
    currentPhase,
    running,
    formatTime,
    phaseLabel,
    getProgress,
    startFocus,
    pause,
    resume,
    reset,
    focusDurationSec,
    breakDurationSec,
    setFocusDuration,
    setBreakDuration,
    customFocus = $bindable(),
    customBreak = $bindable(),
    sessionsCompleted,
    totalFocusTime,
    breaksCompleted,
  }: TimerProps = $props();

  const focusOptions = [10, 15, 20, 25, 30, 45, 50, 60, 90];
  const breakOptions = [2, 3, 4, 5, 8, 10, 12, 15, 20];

  // Computed button properties
  const buttonText = $derived(
    currentPhase === 'idle'
      ? 'Start Focus Session'
      : running
        ? 'Pause'
        : 'Resume'
  );

  const ButtonIcon = $derived(
    currentPhase === 'idle' || !running ? Play : Pause
  );
</script>

<div class="max-w-4xl mx-auto space-y-8">
  <!-- Main Timer section -->
  <section class="bg-accent border rounded-xl p-8 shadow-lg gap-6 flex flex-col items-center">
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
          class="text-border"
        />
        <circle
          cx="50"
          cy="50"
          r="45"
          stroke="currentColor"
          stroke-width="3"
          fill="none"
          stroke-dasharray="283"
          stroke-dashoffset={283 - getProgress()}
          class="text-primary transition-all duration-1000 ease-linear"
          stroke-linecap="round"
        />
      </svg>

      <div class="absolute inset-0 flex flex-col items-center justify-center">
        <div class="text-6xl font-mono font-bold text-foreground">
          {currentPhase === 'idle' ? '0:00' : formatTime}
        </div>
        <div class="text-muted-foreground text-sm mt-2">{phaseLabel}</div>
      </div>
    </div>

    <!-- Control Buttons -->
    <div class="flex gap-4">
      <Button
        size="lg"
        onclick={() => {
          if (currentPhase === 'idle') {
            startFocus();
          } else {
            running ? pause() : resume();
          }
        }}
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
  <Card class="bg-card border-border shadow-lg">
    <CardHeader>
      <CardTitle class="flex items-center gap-2 text-card-foreground">
        <Settings class="w-5 h-5" />
        Session Settings
      </CardTitle>
    </CardHeader>
    <CardContent class="space-y-6">
      <div class="grid md:grid-cols-2 gap-6">
        <!-- Focus Duration -->
        <div>
          <h3
            class="text-sm font-semibold text-card-foreground mb-3 flex items-center gap-2"
          >
            <Target class="w-4 h-4" />
            Focus Duration
          </h3>
          <div class="flex flex-wrap gap-2 mb-3">
            {#each focusOptions as duration}
              <Button
                variant={Math.floor(focusDurationSec / 60) === duration
                  ? 'default'
                  : 'outline'}
                size="sm"
                onclick={() => setFocusDuration(duration)}
              >
                {duration}m
              </Button>
            {/each}
            <div class="flex items-center gap-2">
              <span class="text-sm text-muted-foreground">or</span>
              <Input
                type="number"
                placeholder="Custom"
                bind:value={customFocus}
                class="w-20 px-2 py-1 text-sm border border-border rounded bg-input"
              />
              <span class="text-sm text-muted-foreground">min</span>
            </div>
          </div>
          <p class="text-xs text-muted-foreground">
            Current: {(focusDurationSec / 60).toFixed(1)} minutes
          </p>
        </div>

        <!-- Break Duration -->
        <div>
          <h3
            class="text-sm font-semibold text-card-foreground mb-3 flex items-center gap-2"
          >
            <Clock class="w-4 h-4" />
            Break Duration
          </h3>
          <div class="flex flex-wrap gap-2 mb-3">
            {#each breakOptions as duration}
              <Button
                variant={Math.floor(breakDurationSec / 60) === duration
                  ? 'default'
                  : 'outline'}
                size="sm"
                onclick={() => setBreakDuration(duration)}
              >
                {duration}m
              </Button>
            {/each}
            <div class="flex items-center gap-2">
              <span class="text-sm text-muted-foreground">or</span>
              <Input
                type="number"
                placeholder="Custom"
                bind:value={customBreak}
                class="w-20 px-2 py-1 text-sm border border-border rounded bg-input"
              />
              <span class="text-sm text-muted-foreground">min</span>
            </div>
          </div>
          <p class="text-xs text-muted-foreground">
            Current: {(breakDurationSec / 60).toFixed(1)} minutes
          </p>
        </div>
      </div>
    </CardContent>
  </Card>

  <!-- Stats Preview -->
  <Card class="bg-card border-border shadow-lg">
    <CardHeader>
      <CardTitle class="flex items-center gap-2 text-card-foreground">
        <BarChart3 class="w-5 h-5" />
        Today's Progress
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div class="grid grid-cols-3 gap-4 text-center">
        <div class="space-y-1">
          <div class="text-2xl font-bold text-accent">{sessionsCompleted}</div>
          <div class="text-sm text-muted-foreground">Sessions</div>
        </div>
        <div class="space-y-1">
          <div class="text-2xl font-bold text-accent">
            {Math.floor(totalFocusTime / 60)}h {totalFocusTime % 60}m
          </div>
          <div class="text-sm text-muted-foreground">Focused</div>
        </div>
        <div class="space-y-1">
          <div class="text-2xl font-bold text-accent">{breaksCompleted}</div>
          <div class="text-sm text-muted-foreground">Breaks</div>
        </div>
      </div>
    </CardContent>
  </Card>
</div>
