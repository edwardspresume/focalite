<script lang="ts">
  import Badge from '$lib/components/ui/badge/badge.svelte';
  import Button from '$lib/components/ui/button/button.svelte';
  import CardContent from '$lib/components/ui/card/card-content.svelte';
  import Card from '$lib/components/ui/card/card.svelte';
  import { Activity, Coffee, Pause, Play, Square } from '@lucide/svelte';

  type BreakProps = {
    timeLabel: string;
    phaseLabel: string;
    dashOffset: number;
    pause: () => void;
    resume: () => void;
    handleEndBreak: () => void;
    running: boolean;
  };

  let { timeLabel, phaseLabel, dashOffset, pause, resume, handleEndBreak, running }: BreakProps = $props();
</script>

<div class="max-w-2xl mx-auto space-y-8">

  <!-- Break Card -->
  <Card class="bg-accent border-border shadow-lg">
    <CardContent class="p-8">
      <div class="text-center space-y-6">
        <!-- Break Message -->
        <div class="space-y-2">
          <div class="flex items-center justify-center gap-2 text-primary">
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
                stroke-dashoffset={dashOffset}
                class="text-primary transition-all duration-1000 ease-linear"
                stroke-linecap="round"
              />
            </svg>
            <div class="absolute inset-0 flex flex-col items-center justify-center">
              <div class="text-6xl font-mono font-bold text-foreground">{timeLabel}</div>
              <div class="text-muted-foreground text-sm mt-2">{phaseLabel}</div>
            </div>
          </div>
        </div>

        <div class="flex gap-4 justify-center">
          {#if running}
            <Button variant="outline" size="lg" class="px-8 py-3 bg-transparent" onclick={pause}>
              <Pause class="w-4 h-4 mr-2" />Pause
            </Button>
          {:else}
            <Button variant="outline" size="lg" class="px-8 py-3 bg-transparent" onclick={resume}>
              <Play class="w-4 h-4 mr-2" />Resume
            </Button>
          {/if}
          <Button variant="destructive" size="lg" class="px-8 py-3" onclick={handleEndBreak}>
            <Square class="w-4 h-4 mr-2" />End Break Early
          </Button>
        </div>

        <div class="flex justify-center gap-6 text-sm text-muted-foreground">
          <div class="flex items-center gap-1">
            <Badge variant="outline" class="px-2 py-1">Space</Badge><span>start/pause/resume</span>
          </div>
          <div class="flex items-center gap-1">
            <Badge variant="outline" class="px-2 py-1">Esc</Badge><span>end break</span>
          </div>
          <div class="flex items-center gap-1">
            <Badge variant="outline" class="px-2 py-1">B</Badge><span>start break</span>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>

  <Card class="bg-accent border-border shadow-lg">
    <CardContent class="p-6">
      <h3 class="text-lg font-semibold text-card-foreground mb-4 flex items-center gap-2">
        <Activity class="w-5 h-5" />Break Suggestions
      </h3>
      <div class="grid grid-cols-2 gap-4">
        {#each [
          { title: 'Physical Movement', items: ['Take a short walk', 'Do some stretches', 'Practice deep breathing'] },
          { title: 'Mental Rest', items: ['Look out the window', 'Hydrate with water', 'Practice mindfulness'] }
        ] as suggestion}
          <div class="p-4 rounded-lg bg-primary/10 border border-primary/20">
            <h4 class="font-medium text-card-foreground mb-2">{suggestion.title}</h4>
            <ul class="text-sm text-muted-foreground space-y-1">
              {#each suggestion.items as item}
                <li>• {item}</li>
              {/each}
            </ul>
          </div>
        {/each}
      </div>
    </CardContent>
  </Card>
</div>
