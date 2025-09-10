<script lang="ts">
  import Button from '$lib/components/ui/button/button.svelte';
  import Card from '$lib/components/ui/card/card.svelte';
  import CardContent from '$lib/components/ui/card/card-content.svelte';
  import Badge from '$lib/components/ui/badge/badge.svelte';
  import { Pause, Square, Coffee, Activity } from '@lucide/svelte';

  type BreakProps = {
    formatTime: string;
    phaseLabel: string;
    getProgress: () => number;
    pause: () => void;
    handleEndBreak: () => void;
  };

  let {
    formatTime,
    phaseLabel,
    getProgress,
    pause,
    handleEndBreak
  }: BreakProps = $props();
</script>

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