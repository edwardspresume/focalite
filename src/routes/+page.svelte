<script lang="ts">
  import { invoke } from '@tauri-apps/api/core';
  import Button from '$lib/components/ui/button/button.svelte';
  import Card from '$lib/components/ui/card/card.svelte';
  import CardContent from '$lib/components/ui/card/card-content.svelte';
  import CardHeader from '$lib/components/ui/card/card-header.svelte';
  import CardTitle from '$lib/components/ui/card/card-title.svelte';
  import CardDescription from '$lib/components/ui/card/card-description.svelte';
  import Input from '$lib/components/ui/input/input.svelte';
  import Label from '$lib/components/ui/label/label.svelte';
  import Badge from '$lib/components/ui/badge/badge.svelte';
  import Separator from '$lib/components/ui/separator/separator.svelte';
  import Collapsible from '$lib/components/ui/collapsible/collapsible.svelte';
  import CollapsibleTrigger from '$lib/components/ui/collapsible/collapsible-trigger.svelte';
  import CollapsibleContent from '$lib/components/ui/collapsible/collapsible-content.svelte';
  import Icon from '@iconify/svelte';
  import walkIcon from '@iconify-icons/mdi/walk';
  import playIcon from '@iconify-icons/mdi/play';
  import pauseIcon from '@iconify-icons/mdi/pause';
  import stopIcon from '@iconify-icons/mdi/stop';
  import restartIcon from '@iconify-icons/mdi/restart';
  import settingsIcon from '@iconify-icons/mdi/cog';
  import keyboardIcon from '@iconify-icons/mdi/keyboard';

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
  <Card class="w-full max-w-xl">
    <CardHeader class="text-center">
      <CardTitle class="text-3xl font-bold tracking-tight">Focalite</CardTitle>
      <CardDescription>Focus timer with enforced breaks</CardDescription>
    </CardHeader>
    <CardContent>

      {#if currentPhase === 'break'}
        <div class="mb-4 text-center text-orange-600">
          <div class="text-lg font-semibold flex items-center justify-center gap-2">
            <Icon icon={walkIcon} class="w-6 h-6" />
            Time to move!
          </div>
          <div class="text-sm">Get up, stretch your legs, and take a refreshing walk</div>
        </div>
      {/if}

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
        <Button
          onclick={startFocus}
          class="col-span-2"
          title="Start focus (Space)"
        >
          <Icon icon={playIcon} class="w-4 h-4 mr-2" />
          Start Focus
        </Button>
      {:else}
        {#if running()}
          <Button
            onclick={pause}
            variant="secondary"
            title="Pause (Space)"
          >
            <Icon icon={pauseIcon} class="w-4 h-4 mr-2" />
            Pause
          </Button>
        {:else}
          <Button
            onclick={resume}
            title="Resume (Space)"
          >
            <Icon icon={playIcon} class="w-4 h-4 mr-2" />
            Resume
          </Button>
        {/if}
        <Button
          onclick={reset}
          variant="outline"
          title={currentPhase === 'break' ? 'End break early (Esc)' : 'Reset (Esc)'}
        >
          <Icon icon={currentPhase === 'break' ? stopIcon : restartIcon} class="w-4 h-4 mr-2" />
          {currentPhase === 'break' ? 'End Break Early' : 'Reset'}
        </Button>
      {/if}
      </div>

      <div class="mt-3 flex justify-center gap-2 flex-wrap">
        <Badge variant="secondary" class="text-xs flex items-center gap-1">
          <Icon icon={keyboardIcon} class="w-3 h-3" />
          Space: start/pause/resume
        </Badge>
        <Badge variant="secondary" class="text-xs flex items-center gap-1">
          <Icon icon={keyboardIcon} class="w-3 h-3" />
          Esc: {currentPhase === 'break' ? 'end break' : 'reset'}
        </Badge>
        <Badge variant="secondary" class="text-xs flex items-center gap-1">
          <Icon icon={keyboardIcon} class="w-3 h-3" />
          B: start break
        </Badge>
      </div>

      <!-- Settings -->
      {#if currentPhase === 'idle'}
        <Separator class="mt-6" />
        <Collapsible class="group">
          <CollapsibleTrigger class="list-none cursor-pointer select-none flex items-center justify-between py-2 w-full">
            <span class="text-lg font-semibold flex items-center gap-2">
              <Icon icon={settingsIcon} class="w-5 h-5" />
              Session Settings
            </span>
            <span class="text-gray-500 group-data-[state=open]:rotate-180 transition-transform">▾</span>
          </CollapsibleTrigger>

          <CollapsibleContent class="mt-4 space-y-6">
            <div class="space-y-2">
              <Label class="text-sm font-medium">Presets</Label>
              <div class="flex flex-wrap gap-2">
                <Button onclick={() => applyPreset(25, 5)} variant="outline" size="sm" title="25 min focus / 5 min break">Pomodoro (25/5)</Button>
                <Button onclick={() => applyPreset(50, 10)} variant="outline" size="sm" title="50 min focus / 10 min break">Long (50/10)</Button>
                <Button onclick={() => applyPreset(15, 3)} variant="outline" size="sm" title="15 min focus / 3 min break">Quick (15/3)</Button>
              </div>
            </div>

            <div class="space-y-2">
              <Label class="text-sm font-medium">Focus Duration</Label>
              <div class="flex items-center gap-2 flex-wrap">
                <div class="flex gap-2">
                  {#each [10, 15, 25, 45, 60] as minutes}
                    <Button onclick={() => setFocusDuration(minutes)} variant={focusDurationSec === minutes * 60 ? 'default' : 'outline'} size="sm">{minutes}m</Button>
                  {/each}
                </div>
                <span class="text-gray-400">or</span>
                <div class="flex items-center gap-1">
                  <Input
                    type="number"
                    min="0.1"
                    max="180"
                    step="0.1"
                    placeholder="Custom"
                    class="w-24"
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
              <Label class="text-sm font-medium">Break Duration</Label>
              <div class="flex items-center gap-2 flex-wrap">
                <div class="flex gap-2">
                  {#each [3, 5, 10, 15] as minutes}
                    <Button onclick={() => setBreakDuration(minutes)} variant={breakDurationSec === minutes * 60 ? 'default' : 'outline'} size="sm">{minutes}m</Button>
                  {/each}
                </div>
                <span class="text-gray-400">or</span>
                <div class="flex items-center gap-1">
                  <Input
                    type="number"
                    min="0.1"
                    max="60"
                    step="0.1"
                    placeholder="Custom"
                    class="w-24"
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
          </CollapsibleContent>
        </Collapsible>
      {/if}
    </CardContent>
  </Card>
</main>
