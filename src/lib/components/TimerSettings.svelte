<script lang="ts">
  import CollapsibleContent from '$lib/components/ui/collapsible/collapsible-content.svelte';
  import CollapsibleTrigger from '$lib/components/ui/collapsible/collapsible-trigger.svelte';
  import Collapsible from '$lib/components/ui/collapsible/collapsible.svelte';
  import Button from '$lib/components/ui/button/button.svelte';
  import Input from '$lib/components/ui/input/input.svelte';
  import Checkbox from '$lib/components/ui/checkbox/checkbox.svelte';
  import { ChevronDown, Clock, RotateCcw, Settings, Target } from '@lucide/svelte';

  type Props = {
    currentPhase: 'focus' | 'break' | 'idle';
    focusDurationSec: number;
    breakDurationSec: number;
    setFocusDuration: (minutes: number) => void;
    setBreakDuration: (minutes: number) => void;
    autoLoop: boolean;
  };

  let {
    currentPhase,
    focusDurationSec,
    breakDurationSec,
    setFocusDuration,
    setBreakDuration,
    autoLoop = $bindable(false)
  }: Props = $props();

  let settingsOpen = $state(false);
  let customFocusInput = $state('');
  let customBreakInput = $state('');

  const focusOptions = [10, 15, 20, 25, 30, 45, 50, 60, 90];
  const breakOptions = [2, 3, 4, 5, 8, 10, 12, 15, 20];

  const focusMinutes = $derived(Math.floor(focusDurationSec / 60));
  const breakMinutes = $derived(Math.floor(breakDurationSec / 60));

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

{#snippet durationSection(
  label: string,
  Icon: any,
  options: number[],
  selectedMinutes: number,
  setDuration: (minutes: number) => void,
  seconds: number,
  disabled: boolean,
  getCustom: () => string,
  setCustom: (value: string) => void,
  onBlur: (event: Event) => void
)}
  <h3 class="text-sm font-semibold text-card-foreground mb-3 flex items-center gap-2">
    <Icon class="w-4 h-4" />
    {label}
  </h3>
  <div class="flex flex-wrap gap-2 mb-3">
    {#each options as duration}
      <Button
        variant={selectedMinutes === duration ? 'default' : 'outline'}
        size="sm"
        disabled={disabled}
        onclick={() => setDuration(duration)}
        class={{ 'ring-2 ring-primary/50 shadow-md': selectedMinutes === duration }}
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
      bind:value={() => getCustom(), setCustom}
      onblur={onBlur}
      onkeydown={onKeydown(onBlur)}
      disabled={disabled}
      class="w-32"
    />
    <span class="text-sm text-muted-foreground">minutes</span>
  </div>
  <p class="text-xs text-muted-foreground">
    {#if currentPhase === 'idle'}
      Current: {(seconds / 60).toFixed(1)} minutes
    {:else}
      Next session: {(seconds / 60).toFixed(1)} minutes
    {/if}
  </p>
{/snippet}

<Collapsible bind:open={settingsOpen}>
  <section class="bg-accent border rounded-xl shadow-lg">
    <CollapsibleTrigger class="w-full">
      <header class="p-6 hover:bg-muted/50 transition-colors cursor-pointer rounded-t-xl">
        <h2 class="flex items-center justify-between text-foreground text-xl font-semibold">
          <div class="flex items-center gap-2">
            <Settings class="size-5" />
            Session Settings
          </div>
          <ChevronDown class={['size-4 transition-transform duration-200', { 'rotate-180': settingsOpen }]} />
        </h2>
      </header>
    </CollapsibleTrigger>
    <CollapsibleContent>
      <div class="p-6 pt-0 space-y-6">
        <div class="grid md:grid-cols-2 gap-6">
          <!-- Focus Duration -->
          <div>
            {@render durationSection(
              'Focus Duration',
              Target,
              focusOptions,
              focusMinutes,
              setFocusDuration,
              focusDurationSec,
              currentPhase !== 'idle',
              () => customFocusInput,
              (v: string) => (customFocusInput = v),
              onFocusInput
            )}
          </div>

          <!-- Break Duration -->
          <div>
            {@render durationSection(
              'Break Duration',
              Clock,
              breakOptions,
              breakMinutes,
              setBreakDuration,
              breakDurationSec,
              currentPhase !== 'idle',
              () => customBreakInput,
              (v: string) => (customBreakInput = v),
              onBreakInput
            )}
          </div>
        </div>

        <!-- Auto Loop Setting -->
        <div class="border-t pt-6">
          <div class="flex items-center space-x-3">
            <Checkbox bind:checked={autoLoop} />
            <div class="grid gap-1.5 leading-none">
              <button
                type="button"
                class="text-sm font-medium leading-none text-left flex items-center gap-2 cursor-pointer hover:text-foreground"
                onclick={() => (autoLoop = !autoLoop)}
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
