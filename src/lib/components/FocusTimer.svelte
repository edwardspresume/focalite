<script lang="ts">
	import { timer } from '$lib/stores/timer.svelte';
	import { Pause, Play, RotateCcw } from 'lucide-svelte';
	import KeyboardShortcut from './KeyboardShortcut.svelte';
	import Button from './ui/button/button.svelte';

	function onKey(e: KeyboardEvent) {
		if ((e.target as HTMLElement)?.tagName === 'INPUT') return;

		const key = e.key;

		if (key === 'Escape') {
			timer.reset();
			return;
		}

		if (key === ' ' && timer.phase !== 'break') {
			e.preventDefault();
			if (timer.phase === 'idle') timer.startFocus();
			else if (timer.running) timer.pause();
			else timer.resume();
			return;
		}

		if (key.toLowerCase() === 'b') {
			e.preventDefault();
			timer.startManualBreak();
		}
	}
</script>

<svelte:window onkeydown={onKey} />

<section
	class="grid place-items-center gap-8 rounded-lg border bg-background p-8 shadow-md dark:border-input"
>
	<!-- Timer Display -->
	<figure class="relative size-64">
		<svg class="-rotate-90" viewBox="0 0 100 100" aria-hidden="true">
			<!-- track -->
			<circle
				cx="50"
				cy="50"
				r={timer.r}
				fill="none"
				stroke-width="2"
				stroke="currentColor"
				class="text-primary/30"
			/>

			<!-- progress -->
			<circle
				cx="50"
				cy="50"
				fill="none"
				r={timer.r}
				stroke-width="3"
				stroke="currentColor"
				stroke-linecap="round"
				stroke-dasharray={timer.C}
				stroke-dashoffset={timer.dashOffset}
				class="text-primary transition-[stroke-dashoffset] duration-1000 ease-linear"
			/>
		</svg>

		<figcaption class="absolute inset-0 flex flex-col items-center justify-center">
			<time class="font-mono text-6xl font-bold text-foreground" aria-live="polite">
				{#if timer.phase === 'idle'}
					{timer.focusDurationLabel}
				{:else}
					{timer.timeLabel}
				{/if}
			</time>
			<p class="mt-2 text-sm text-muted-foreground dark:text-foreground/80">
				{timer.phaseLabel}
			</p>
		</figcaption>
	</figure>

	<!-- Control Buttons -->
	<div class="flex gap-4">
		{#if timer.phase === 'idle'}
			<Button
				size="lg"
				class="text-lg shadow-sm hover:shadow-md"
				onclick={() => timer.startFocus()}
			>
				<Play class="size-4" /> Start Focus
			</Button>
		{:else if timer.phase === 'focus'}
			<Button
				size="lg"
				variant={timer.running ? 'outline' : undefined}
				onclick={() => (timer.running ? timer.pause() : timer.resume())}
			>
				{#if timer.running}
					<Pause class="size-4" /> Pause
				{:else}
					<Play class="size-4" /> Resume
				{/if}
			</Button>

			<Button
				size="lg"
				variant='outline'
				onclick={() => timer.reset()}
			>
				<RotateCcw class="size-4" /> Reset
			</Button>
		{/if}
	</div>

	<!-- Break Duration Display -->
		<p
			class="text-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary dark:bg-primary/20 dark:text-primary-foreground"
		>
			Break duration: <span class="font-mono">{timer.breakDurationLabel}</span>
		</p>

	<div class="flex gap-6 text-sm text-muted-foreground dark:text-foreground/80">
		<KeyboardShortcut key="Space" label="Start/Pause/Resume" />
		<KeyboardShortcut key="Esc" label="Reset" />
		<KeyboardShortcut key="B" label="Start Break" />
	</div>
</section>
