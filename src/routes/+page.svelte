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

<main class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-6">
  <Card class="w-full max-w-xl shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
    <CardHeader class="text-center pb-6">
      <CardTitle class="text-4xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Focalite</CardTitle>
      <CardDescription class="text-slate-600 text-lg mt-2">Focus timer with enforced breaks</CardDescription>
    </CardHeader>
    <CardContent>

      {#if currentPhase === 'break'}
        <div class="mb-6 text-center">
          <div class="inline-flex items-center justify-center gap-3 bg-gradient-to-r from-orange-100 to-amber-100 px-6 py-4 rounded-2xl border border-orange-200">
            <Icon icon={walkIcon} class="w-7 h-7 text-orange-600" />
            <div>
              <div class="text-lg font-semibold text-orange-700">Time to move!</div>
              <div class="text-sm text-orange-600">Get up, stretch your legs, and take a refreshing walk</div>
            </div>
          </div>
        </div>
      {/if}

      <!-- Timer Display with Progress Ring -->
      <div class="flex items-center justify-center mb-8">
      <div class="relative p-4" aria-label={phaseLabel} role="region">
        {#key currentPhase}
          <svg
            width={ringSize}
            height={ringSize}
            viewBox={`0 0 ${ringSize} ${ringSize}`}
            class="drop-shadow-2xl filter"
            role="progressbar"
            aria-valuemin="0"
            aria-valuemax="100"
            aria-valuenow={Math.round(progress() * 100)}
          >
            <!-- Background ring with subtle gradient -->
            <defs>
              <linearGradient id="bg-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#f1f5f9;stop-opacity:1" />
                <stop offset="100%" style="stop-color:#e2e8f0;stop-opacity:1" />
              </linearGradient>
              <linearGradient id="progress-gradient-focus" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#10b981;stop-opacity:1" />
                <stop offset="100%" style="stop-color:#059669;stop-opacity:1" />
              </linearGradient>
              <linearGradient id="progress-gradient-break" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#f59e0b;stop-opacity:1" />
                <stop offset="100%" style="stop-color:#d97706;stop-opacity:1" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge> 
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            <circle
              cx={ringSize / 2}
              cy={ringSize / 2}
              r={ringR}
              stroke="url(#bg-gradient)"
              stroke-width={ringStroke}
              fill="none"
            />
            <g transform={`rotate(-90 ${ringSize / 2} ${ringSize / 2})`}>
              <circle
                cx={ringSize / 2}
                cy={ringSize / 2}
                r={ringR}
                stroke={currentPhase === 'focus' ? 'url(#progress-gradient-focus)' : currentPhase === 'break' ? 'url(#progress-gradient-break)' : '#cbd5e1'}
                stroke-width={ringStroke}
                stroke-linecap="round"
                fill="none"
                filter={progress() > 0 ? 'url(#glow)' : 'none'}
                style={`stroke-dasharray: ${ringCirc * progress()}, ${ringCirc}; transition: stroke-dasharray 0.3s cubic-bezier(0.4, 0, 0.2, 1);`}
              />
            </g>
          </svg>
        {/key}
        <div class="absolute inset-0 grid place-items-center">
          <div class="text-center select-none">
            <div class="text-6xl font-mono font-bold bg-gradient-to-b from-slate-800 to-slate-600 bg-clip-text text-transparent tabular-nums drop-shadow-sm" aria-live="polite">{formatTime}</div>
            <div class="text-base mt-2 font-medium text-slate-500">{phaseLabel}</div>
          </div>
        </div>
      </div>
      </div>

      <!-- Controls -->
      <div class="grid grid-cols-2 gap-4">
      {#if currentPhase === 'idle'}
        <Button
          onclick={startFocus}
          class="col-span-2 h-14 text-lg font-semibold bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl"
          title="Start focus (Space)"
        >
          <Icon icon={playIcon} class="w-5 h-5 mr-3" />
          Start Focus
        </Button>
      {:else}
        {#if running()}
          <Button
            onclick={pause}
            variant="secondary"
            class="h-12 text-base font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 shadow-md hover:shadow-lg transition-all duration-200 rounded-xl"
            title="Pause (Space)"
          >
            <Icon icon={pauseIcon} class="w-4 h-4 mr-2" />
            Pause
          </Button>
        {:else}
          <Button
            onclick={resume}
            class="h-12 text-base font-medium bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-md hover:shadow-lg transition-all duration-200 rounded-xl"
            title="Resume (Space)"
          >
            <Icon icon={playIcon} class="w-4 h-4 mr-2" />
            Resume
          </Button>
        {/if}
        <Button
          onclick={reset}
          variant="outline"
          class="h-12 text-base font-medium border-2 border-slate-300 hover:border-slate-400 text-slate-700 hover:bg-slate-50 shadow-md hover:shadow-lg transition-all duration-200 rounded-xl"
          title={currentPhase === 'break' ? 'End break early (Esc)' : 'Reset (Esc)'}
        >
          <Icon icon={currentPhase === 'break' ? stopIcon : restartIcon} class="w-4 h-4 mr-2" />
          {currentPhase === 'break' ? 'End Break Early' : 'Reset'}
        </Button>
      {/if}
      </div>

      <div class="mt-6 flex justify-center gap-2 flex-wrap">
        <Badge variant="secondary" class="text-xs flex items-center gap-1.5 bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg border border-slate-200">
          <Icon icon={keyboardIcon} class="w-3 h-3" />
          Space: start/pause/resume
        </Badge>
        <Badge variant="secondary" class="text-xs flex items-center gap-1.5 bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg border border-slate-200">
          <Icon icon={keyboardIcon} class="w-3 h-3" />
          Esc: {currentPhase === 'break' ? 'end break' : 'reset'}
        </Badge>
        <Badge variant="secondary" class="text-xs flex items-center gap-1.5 bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg border border-slate-200">
          <Icon icon={keyboardIcon} class="w-3 h-3" />
          B: start break
        </Badge>
      </div>

      <!-- Settings -->
      {#if currentPhase === 'idle'}
        <Separator class="mt-8" />
        <Collapsible class="group">
          <CollapsibleTrigger class="list-none cursor-pointer select-none flex items-center justify-between py-4 w-full hover:bg-slate-50 rounded-lg px-2 transition-colors">
            <span class="text-lg font-semibold flex items-center gap-3 text-slate-700">
              <Icon icon={settingsIcon} class="w-5 h-5" />
              Session Settings
            </span>
            <span class="text-slate-400 group-data-[state=open]:rotate-180 transition-transform duration-200">▾</span>
          </CollapsibleTrigger>

          <CollapsibleContent class="mt-4 space-y-8 px-2">
            <div class="space-y-3">
              <Label class="text-sm font-semibold text-slate-700">Presets</Label>
              <div class="flex flex-wrap gap-3">
                <Button onclick={() => applyPreset(25, 5)} variant="outline" size="sm" class="rounded-lg border-slate-300 hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-700 transition-colors" title="25 min focus / 5 min break">Pomodoro (25/5)</Button>
                <Button onclick={() => applyPreset(50, 10)} variant="outline" size="sm" class="rounded-lg border-slate-300 hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-700 transition-colors" title="50 min focus / 10 min break">Long (50/10)</Button>
                <Button onclick={() => applyPreset(15, 3)} variant="outline" size="sm" class="rounded-lg border-slate-300 hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-700 transition-colors" title="15 min focus / 3 min break">Quick (15/3)</Button>
              </div>
            </div>

            <div class="space-y-3">
              <Label class="text-sm font-semibold text-slate-700">Focus Duration</Label>
              <div class="flex items-center gap-3 flex-wrap">
                <div class="flex gap-2">
                  {#each [10, 15, 25, 45, 60] as minutes}
                    <Button 
                      onclick={() => setFocusDuration(minutes)} 
                      variant={focusDurationSec === minutes * 60 ? 'default' : 'outline'} 
                      size="sm"
                      class={focusDurationSec === minutes * 60 
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md rounded-lg' 
                        : 'rounded-lg border-slate-300 hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-700 transition-colors'
                      }
                    >
                      {minutes}m
                    </Button>
                  {/each}
                </div>
                <span class="text-slate-400 text-sm">or</span>
                <div class="flex items-center gap-2">
                  <Input
                    type="number"
                    min="0.1"
                    max="180"
                    step="0.1"
                    placeholder="Custom"
                    class="w-24 rounded-lg border-slate-300 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
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
                  <span class="text-xs text-slate-500 font-medium">min</span>
                </div>
              </div>
              <div class="text-xs text-slate-500 bg-slate-50 rounded-md px-3 py-1 inline-block">Current: {(focusDurationSec / 60).toFixed(1)} minutes</div>
            </div>

            <div class="space-y-3">
              <Label class="text-sm font-semibold text-slate-700">Break Duration</Label>
              <div class="flex items-center gap-3 flex-wrap">
                <div class="flex gap-2">
                  {#each [3, 5, 10, 15] as minutes}
                    <Button 
                      onclick={() => setBreakDuration(minutes)} 
                      variant={breakDurationSec === minutes * 60 ? 'default' : 'outline'} 
                      size="sm"
                      class={breakDurationSec === minutes * 60 
                        ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-md rounded-lg' 
                        : 'rounded-lg border-slate-300 hover:border-orange-400 hover:bg-orange-50 hover:text-orange-700 transition-colors'
                      }
                    >
                      {minutes}m
                    </Button>
                  {/each}
                </div>
                <span class="text-slate-400 text-sm">or</span>
                <div class="flex items-center gap-2">
                  <Input
                    type="number"
                    min="0.1"
                    max="60"
                    step="0.1"
                    placeholder="Custom"
                    class="w-24 rounded-lg border-slate-300 focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
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
                  <span class="text-xs text-slate-500 font-medium">min</span>
                </div>
              </div>
              <div class="text-xs text-slate-500 bg-slate-50 rounded-md px-3 py-1 inline-block">Current: {(breakDurationSec / 60).toFixed(1)} minutes</div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      {/if}
    </CardContent>
  </Card>
</main>
