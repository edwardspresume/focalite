<script lang="ts">
  import { invoke } from '@tauri-apps/api/core';
  import Button from '$lib/components/ui/button/button.svelte';
  import Card from '$lib/components/ui/card/card.svelte';
  import CardContent from '$lib/components/ui/card/card-content.svelte';
  import CardHeader from '$lib/components/ui/card/card-header.svelte';
  import CardTitle from '$lib/components/ui/card/card-title.svelte';
  import Input from '$lib/components/ui/input/input.svelte';
  import Badge from '$lib/components/ui/badge/badge.svelte';
  import { Play, Pause, Square, Settings, Clock, Target, BarChart3, Coffee, Activity } from '@lucide/svelte';

  type TimerPhase = 'focus' | 'break' | 'idle';

  // Base state
  let focusDurationSec = $state(25 * 60); // 25 minutes
  let breakDurationSec = $state(5 * 60); // 5 minutes
  let customFocus = $state("");
  let customBreak = $state("");
  let currentPhase: TimerPhase = $state('idle');
  let startedAt: number | null = $state(null);
  let now = $state(Date.now());
  let baseElapsedSec = $state(0);
  let sessionsCompleted = $state(0);
  let totalFocusTime = $state(0);
  let breaksCompleted = $state(0);

  const focusOptions = [10, 15, 20, 25, 30, 45, 50, 60, 90];
  const breakOptions = [2, 3, 4, 5, 8, 10, 12, 15, 20];

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

  const phaseLabel = $derived.by(() =>
    currentPhase === 'idle'
      ? 'Ready to Focus'
      : currentPhase === 'focus'
        ? running() ? 'Focus Time' : 'Focus Paused'
        : running() ? 'Break Time' : 'Break Paused'
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
      // Break completed, return to idle
      breaksCompleted++;
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

  async function handleEndBreak() {
    await reset();
    breaksCompleted++;
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
    const totalTime = currentPhase === 'focus' ? focusDurationSec : breakDurationSec;
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

{#if currentPhase === 'break'}
  <!-- Break View -->
  <div class="max-w-2xl mx-auto space-y-8">
    <!-- Header -->
    <div class="text-center space-y-2">
      <h1 class="text-4xl font-bold text-foreground">Focalite</h1>
      <p class="text-muted-foreground text-lg">Focus timer with enforced breaks</p>
    </div>

    <!-- Break Card -->
    <Card class="bg-card border-border shadow-lg">
      <CardContent class="p-8">
        <div class="text-center space-y-6">
          <!-- Break Message -->
          <div class="space-y-2">
            <div class="flex items-center justify-center gap-2 text-accent">
              <Coffee class="w-6 h-6" />
              <h2 class="text-2xl font-bold">Time to move!</h2>
            </div>
            <p class="text-muted-foreground text-lg">Get up, stretch your legs, and take a refreshing walk</p>
          </div>

          <!-- Timer Display -->
          <div class="relative">
            <div class="w-64 h-64 mx-auto relative">
              <svg class="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
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
                  class="text-accent transition-all duration-1000 ease-linear"
                  stroke-linecap="round"
                />
              </svg>
              <div class="absolute inset-0 flex flex-col items-center justify-center">
                <div class="text-6xl font-mono font-bold text-foreground">{formatTime}</div>
                <div class="text-muted-foreground text-sm mt-2">{phaseLabel}</div>
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex gap-4 justify-center">
            <Button variant="outline" size="lg" class="px-8 py-3 bg-transparent" onclick={pause}>
              <Pause class="w-4 h-4 mr-2" />
              Pause
            </Button>
            <Button variant="destructive" size="lg" class="px-8 py-3" onclick={handleEndBreak}>
              <Square class="w-4 h-4 mr-2" />
              End Break Early
            </Button>
          </div>

          <!-- Keyboard Shortcuts -->
          <div class="flex justify-center gap-6 text-sm text-muted-foreground">
            <div class="flex items-center gap-1">
              <Badge variant="outline" class="px-2 py-1">Space</Badge>
              <span>start/pause/resume</span>
            </div>
            <div class="flex items-center gap-1">
              <Badge variant="outline" class="px-2 py-1">Esc</Badge>
              <span>end break</span>
            </div>
            <div class="flex items-center gap-1">
              <Badge variant="outline" class="px-2 py-1">B</Badge>
              <span>start break</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Break Suggestions -->
    <Card class="bg-card border-border shadow-lg">
      <CardContent class="p-6">
        <h3 class="text-lg font-semibold text-card-foreground mb-4 flex items-center gap-2">
          <Activity class="w-5 h-5" />
          Break Suggestions
        </h3>
        <div class="grid grid-cols-2 gap-4">
          <div class="p-4 rounded-lg bg-accent/10 border border-accent/20">
            <h4 class="font-medium text-card-foreground mb-2">Physical Movement</h4>
            <ul class="text-sm text-muted-foreground space-y-1">
              <li>• Take a short walk</li>
              <li>• Do some stretches</li>
              <li>• Practice deep breathing</li>
            </ul>
          </div>
          <div class="p-4 rounded-lg bg-accent/10 border border-accent/20">
            <h4 class="font-medium text-card-foreground mb-2">Mental Rest</h4>
            <ul class="text-sm text-muted-foreground space-y-1">
              <li>• Look out the window</li>
              <li>• Hydrate with water</li>
              <li>• Practice mindfulness</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
{:else}
  <!-- Timer View -->
  <div class="max-w-4xl mx-auto space-y-8">
    <!-- Header -->
    <div class="text-center space-y-2">
      <h1 class="text-4xl font-bold text-foreground">Focalite</h1>
      <p class="text-muted-foreground text-lg">Focus timer with enforced breaks</p>
    </div>

    <!-- Main Timer Card -->
    <Card class="bg-card border-border shadow-lg">
      <CardContent class="p-8">
        <div class="text-center space-y-6">
          <!-- Timer Display -->
          <div class="relative">
            <div class="w-64 h-64 mx-auto relative">
              <svg class="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
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
                  class="text-accent transition-all duration-1000 ease-linear"
                  stroke-linecap="round"
                />
              </svg>
              <div class="absolute inset-0 flex flex-col items-center justify-center">
                <div class="text-6xl font-mono font-bold text-foreground">
                  {currentPhase === 'idle' ? "0:00" : formatTime}
                </div>
                <div class="text-muted-foreground text-sm mt-2">{phaseLabel}</div>
              </div>
            </div>
          </div>

          <!-- Control Buttons -->
          <div class="flex justify-center gap-4">
            <Button
              size="lg"
              onclick={() => {
                if (currentPhase === 'idle') {
                  startFocus();
                } else {
                  running() ? pause() : resume();
                }
              }}
              class="bg-accent hover:bg-accent/90 text-accent-foreground px-8 py-4 text-lg font-semibold rounded-xl shadow-lg transition-all hover:shadow-xl"
            >
              {#if currentPhase === 'idle'}
                <Play class="w-5 h-5 mr-2" />
                Start Focus Session
              {:else if running()}
                <Pause class="w-5 h-5 mr-2" />
                Pause
              {:else}
                <Play class="w-5 h-5 mr-2" />
                Resume
              {/if}
            </Button>

            {#if currentPhase !== 'idle'}
              <Button
                size="lg"
                variant="outline"
                onclick={reset}
                class="px-8 py-4 text-lg font-semibold rounded-xl bg-transparent"
              >
                <Square class="w-5 h-5 mr-2" />
                Reset
              </Button>
            {/if}
          </div>

          <div class="flex justify-center gap-6 text-sm text-muted-foreground">
            <span>
              <kbd class="px-1.5 py-0.5 bg-border text-foreground rounded text-xs font-mono">Space</kbd>
              start/pause/resume
            </span>
            <span>
              <kbd class="px-1.5 py-0.5 bg-border text-foreground rounded text-xs font-mono">Esc</kbd> reset
            </span>
            <span>
              <kbd class="px-1.5 py-0.5 bg-border text-foreground rounded text-xs font-mono">B</kbd> start break
            </span>
          </div>
        </div>
      </CardContent>
    </Card>

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
            <h3 class="text-sm font-semibold text-card-foreground mb-3 flex items-center gap-2">
              <Target class="w-4 h-4" />
              Focus Duration
            </h3>
            <div class="flex flex-wrap gap-2 mb-3">
              {#each focusOptions as duration}
                <Button
                  variant={Math.floor(focusDurationSec / 60) === duration ? "default" : "outline"}
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
            <p class="text-xs text-muted-foreground">Current: {(focusDurationSec / 60).toFixed(1)} minutes</p>
          </div>

          <!-- Break Duration -->
          <div>
            <h3 class="text-sm font-semibold text-card-foreground mb-3 flex items-center gap-2">
              <Clock class="w-4 h-4" />
              Break Duration
            </h3>
            <div class="flex flex-wrap gap-2 mb-3">
              {#each breakOptions as duration}
                <Button
                  variant={Math.floor(breakDurationSec / 60) === duration ? "default" : "outline"}
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
            <p class="text-xs text-muted-foreground">Current: {(breakDurationSec / 60).toFixed(1)} minutes</p>
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
{/if}
