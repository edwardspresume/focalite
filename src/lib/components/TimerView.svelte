<script lang="ts">
  import Button from '$lib/components/ui/button/button.svelte';
  import CollapsibleContent from '$lib/components/ui/collapsible/collapsible-content.svelte';
  import CollapsibleTrigger from '$lib/components/ui/collapsible/collapsible-trigger.svelte';
  import Collapsible from '$lib/components/ui/collapsible/collapsible.svelte';
  import Input from '$lib/components/ui/input/input.svelte';
  import Checkbox from '$lib/components/ui/checkbox/checkbox.svelte';
  import {
    ChartBar,
    ChevronDown,
    Clock,
    Pause,
    Play,
    RotateCcw,
    Settings,
    Square,
    Target,
  } from '@lucide/svelte';

  type TimerProps = {
    currentPhase: 'focus' | 'break' | 'idle';
    running: boolean;
    formatTime: () => string;
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
    sessionsCompleted: number;
    totalFocusTime: number;
    breaksCompleted: number;
    autoLoop: boolean;
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
    sessionsCompleted,
    totalFocusTime,
    breaksCompleted,
    autoLoop = $bindable(false),
  }: TimerProps = $props();

  const focusOptions = [10, 15, 20, 25, 30, 45, 50, 60, 90];
  const breakOptions = [2, 3, 4, 5, 8, 10, 12, 15, 20];

  const buttonText = $derived(
    currentPhase === 'idle' ? 'Start Focus Session' :
    running ? 'Pause' : 'Resume'
  );

  const ButtonIcon = $derived(currentPhase === 'idle' || !running ? Play : Pause);

  let settingsOpen = $state(false);
  let customFocusInput = $state('');
  let customBreakInput = $state('');

  function handleCustomInput(value: string, setter: (minutes: number) => void): string {
    const num = parseFloat(value);
    if (!isNaN(num) && num >= 0.1 && num <= 999 && currentPhase === 'idle') {
      setter(num);
      return '';
    }
    return value && currentPhase === 'idle' ? '' : value;
  }

  function onFocusInput(event: Event) {
    const target = event.target as HTMLInputElement;
    customFocusInput = handleCustomInput(target.value, setFocusDuration);
  }

  function onBreakInput(event: Event) {
    const target = event.target as HTMLInputElement;
    customBreakInput = handleCustomInput(target.value, setBreakDuration);
  }

  function onKeydown(handler: (event: Event) => void) {
    return (event: KeyboardEvent) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        handler(event);
      }
    };
  }
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
          class="{currentPhase === 'idle' ? 'text-primary' : 'text-border'}"
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
          {currentPhase === 'idle' ? '0:00' : formatTime()}
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
  <Collapsible bind:open={settingsOpen}>
    <section class="bg-accent border rounded-xl shadow-lg">
      <CollapsibleTrigger class="w-full">
        <header
          class="p-6 hover:bg-muted/50 transition-colors cursor-pointer rounded-t-xl"
        >
          <h2
            class="flex items-center justify-between text-foreground text-xl font-semibold"
          >
            <div class="flex items-center gap-2">
              <Settings class="size-5" />
              Session Settings
            </div>
            <ChevronDown
              class="size-4 transition-transform duration-200 {settingsOpen
                ? 'rotate-180'
                : ''}"
            />
          </h2>
        </header>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div class="p-6 pt-0 space-y-6">
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
                    disabled={currentPhase !== 'idle'}
                    onclick={() => setFocusDuration(duration)}
                    class={Math.floor(focusDurationSec / 60) === duration
                      ? 'ring-2 ring-primary/50 shadow-md'
                      : ''}
                  >
                    {duration}m
                  </Button>
                {/each}
              </div>
              <div class="flex gap-2 items-center mb-3">
                <Input
                  type="number"
                  placeholder="Custom minutes"
                  min="0.1"
                  max="999"
                  step="0.1"
                  bind:value={customFocusInput}
                  onblur={onFocusInput}
                  onkeydown={onKeydown(onFocusInput)}
                  disabled={currentPhase !== 'idle'}
                  class="w-32"
                />
                <span class="text-sm text-muted-foreground">minutes</span>
              </div>
              <p class="text-xs text-muted-foreground">
                {#if currentPhase === 'idle'}
                  Current: {(focusDurationSec / 60).toFixed(1)} minutes
                {:else}
                  Next session: {(focusDurationSec / 60).toFixed(1)} minutes
                {/if}
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
                    disabled={currentPhase !== 'idle'}
                    onclick={() => setBreakDuration(duration)}
                    class={Math.floor(breakDurationSec / 60) === duration
                      ? 'ring-2 ring-primary/50 shadow-md'
                      : ''}
                  >
                    {duration}m
                  </Button>
                {/each}
              </div>
              <div class="flex gap-2 items-center mb-3">
                <Input
                  type="number"
                  placeholder="Custom minutes"
                  min="0.1"
                  max="999"
                  step="0.1"
                  bind:value={customBreakInput}
                  onblur={onBreakInput}
                  onkeydown={onKeydown(onBreakInput)}
                  disabled={currentPhase !== 'idle'}
                  class="w-32"
                />
                <span class="text-sm text-muted-foreground">minutes</span>
              </div>
              <p class="text-xs text-muted-foreground">
                {#if currentPhase === 'idle'}
                  Current: {(breakDurationSec / 60).toFixed(1)} minutes
                {:else}
                  Next session: {(breakDurationSec / 60).toFixed(1)} minutes
                {/if}
              </p>
            </div>
          </div>

          <!-- Auto Loop Setting -->
          <div class="border-t pt-6">
            <div class="flex items-center space-x-3">
              <Checkbox 
                bind:checked={autoLoop}
              />
              <div class="grid gap-1.5 leading-none">
                <button
                  type="button"
                  class="text-sm font-medium leading-none text-left flex items-center gap-2 cursor-pointer hover:text-foreground"
                  onclick={() => autoLoop = !autoLoop}
                >
                  <RotateCcw class="w-4 h-4" />
                  Auto loop sessions
                </button>
                <p class="text-xs text-muted-foreground">
                  Automatically start a new focus session after each break completes
                </p>
              </div>
            </div>
          </div>
        </div>
      </CollapsibleContent>
    </section>
  </Collapsible>

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
