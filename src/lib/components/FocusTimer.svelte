<script lang="ts">
	import { timer } from '$lib/stores/timer.svelte';
	import { Play, Pause, RotateCcw } from 'lucide-svelte';
	import Button from './ui/button/button.svelte';
	import KeyboardShortcut from './KeyboardShortcut.svelte';

	function onKey(e: KeyboardEvent) {
		if ((e.target as HTMLElement)?.tagName === 'INPUT') return;

		if (e.key === ' ') {
			e.preventDefault();
			if (timer.phase === 'idle') timer.startFocus();
			else if (timer.running) timer.pause();
			else timer.resume();
		} else if (e.key === 'Escape') {
			timer.reset();
		}
	}
</script>

<svelte:window onkeydown={onKey} />

<section
	class="grid place-items-center gap-8 rounded-lg border bg-background p-8 shadow-md dark:border-input"
>
	<!-- Timer Display -->
	<figure class="relative size-72">
		<svg class="size-full -rotate-90 transform" viewBox="0 0 100 100" aria-hidden="true">
			<!-- track -->
			<circle cx="50" cy="50" r={timer.r} stroke="currentColor" stroke-width="2" fill="none" class="text-primary/30" />
			<!-- progress -->
			<circle
				cx="50" cy="50" r={timer.r}
				stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round"
				stroke-dasharray={timer.C} stroke-dashoffset={timer.dashOffset}
				class="text-primary transition-[stroke-dashoffset] duration-1000 ease-linear"
			/>
		</svg>

			<figcaption class="absolute inset-0 flex flex-col items-center justify-center">
	            <time
	                class="font-mono text-6xl font-bold text-foreground"
	                datetime={`PT${timer.displaySeconds}S`}
	                aria-live="polite"
	            >
	                {timer.timeLabel}
	            </time>
			<p class="mt-2 text-sm text-muted-foreground dark:text-foreground/80">
				{timer.phaseLabel}
			</p>
		</figcaption>
	</figure>

	<!-- Control Buttons -->
	<div class="flex gap-4">
		{#if timer.phase === 'idle'}
			<Button size="lg" class="text-lg font-semibold shadow-sm hover:shadow-md" onclick={timer.startFocus}>
				<Play class="size-4" /> Start Focus
			</Button>
		{:else if timer.running}
			<Button size="lg" variant="outline" onclick={timer.pause}><Pause class="size-4" /> Pause</Button>
			<Button size="lg" variant="secondary" onclick={timer.reset}><RotateCcw class="size-4" /> Reset</Button>
		{:else}
			<Button size="lg" onclick={timer.resume}><Play class="size-4" /> Resume</Button>
			<Button size="lg" variant="secondary" onclick={timer.reset}><RotateCcw class="size-4" /> Reset</Button>
		{/if}
	</div>

	<div class="flex gap-6 text-sm text-muted-foreground dark:text-foreground/80">
		<KeyboardShortcut key="Space" label="Start/Pause/Resume" />
		<KeyboardShortcut key="Esc" label="Reset" />
	</div>
</section>
