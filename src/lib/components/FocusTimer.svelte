<script lang="ts">
	import { preferences } from '$lib/stores/preferences.svelte';
	import { Play, Pause, RotateCcw } from 'lucide-svelte';
	import Button from './ui/button/button.svelte';
	import KeyboardShortcut from './KeyboardShortcut.svelte';

	// geometry
	const r = 45;
	const C = 2 * Math.PI * r;

	type TimerState = 'idle' | 'running' | 'paused' | 'done';
	let state = $state<TimerState>('idle');

    // Round fractional minutes to whole seconds; ensure at least 1 second
    let total = $derived(Math.max(1, Math.round(preferences.focusMinutes * 60)));
	let remaining = $state(total);

	let endAt = 0;
	let interval: ReturnType<typeof setInterval> | undefined;

	// keep idle display in sync with Settings
	$effect(() => {
		total;
		if (state === 'idle') remaining = total;
	});

	const mmss = $derived(format(remaining));
	const progress = $derived(1 - remaining / total); // 0..1
	const dashOffset = $derived(C * (1 - progress));

	function format(sec: number) {
		const m = Math.floor(sec / 60);
		const s = sec % 60;
		return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
	}

	function start() {
		remaining = total;
		endAt = Date.now() + remaining * 1000;
		state = 'running';
		run();
	}

	function run() {
		stop();
		interval = setInterval(() => {
			const next = Math.max(0, Math.round((endAt - Date.now()) / 1000));
			if (next !== remaining) remaining = next;
			if (remaining === 0) {
				stop();
				state = 'done';
			}
		}, 250);
	}

	function pause() {
		if (state !== 'running') return;
		stop();
		state = 'paused';
	}

	function resume() {
		if (state !== 'paused') return;
		endAt = Date.now() + remaining * 1000;
		state = 'running';
		run();
	}

	function reset() {
		stop();
		state = 'idle';
		remaining = total;
	}

	function stop() {
		if (interval) {
			clearInterval(interval);
			interval = undefined;
		}
	}

	function onKey(e: KeyboardEvent) {
		if ((e.target as HTMLElement)?.tagName === 'INPUT') return;

		if (e.key === ' ') {
			e.preventDefault();
			if (state === 'idle') start();
			else if (state === 'running') pause();
			else if (state === 'paused') resume();
		} else if (e.key === 'Escape') {
			reset();
		} else if (e.key.toLowerCase() === 'b') {
			// TODO: trigger break flow
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
			<circle cx="50" cy="50" r={r} stroke="currentColor" stroke-width="2" fill="none" class="text-primary/30" />
			<!-- progress -->
			<circle
				cx="50" cy="50" r={r}
				stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round"
				stroke-dasharray={C} stroke-dashoffset={dashOffset}
				class="text-primary transition-[stroke-dashoffset] duration-1000 ease-linear"
			/>
		</svg>

		<figcaption class="absolute inset-0 flex flex-col items-center justify-center">
            <time
                class="font-mono text-6xl font-bold text-foreground"
                datetime={`PT${total}S`}
                aria-live="polite"
            >
                {mmss}
            </time>
			<p class="mt-2 text-sm text-muted-foreground dark:text-foreground/80">
				{state === 'idle' ? 'Ready to focus' :
				 state === 'running' ? 'Focusing...' :
				 state === 'paused' ? 'Paused' : 'Complete'}
			</p>
		</figcaption>
	</figure>

	<!-- Control Buttons -->
	<div class="flex gap-4">
		{#if state === 'idle'}
			<Button size="lg" class="text-lg font-semibold shadow-sm hover:shadow-md" onclick={start}>
				<Play class="size-4" /> Start Focus
			</Button>
		{:else if state === 'running'}
			<Button size="lg" variant="outline" onclick={pause}><Pause class="size-4" /> Pause</Button>
			<Button size="lg" variant="secondary" onclick={reset}><RotateCcw class="size-4" /> Reset</Button>
		{:else if state === 'paused'}
			<Button size="lg" onclick={resume}><Play class="size-4" /> Resume</Button>
			<Button size="lg" variant="secondary" onclick={reset}><RotateCcw class="size-4" /> Reset</Button>
		{:else}
			<Button size="lg" onclick={reset}><RotateCcw class="size-4" /> Reset</Button>
		{/if}
	</div>

	<div class="flex gap-6 text-sm text-muted-foreground dark:text-foreground/80">
		<KeyboardShortcut key="Space" label="Start/Pause/Resume" />
		<KeyboardShortcut key="Esc" label="Reset" />
		<KeyboardShortcut key="B" label="Start Break" />
	</div>
</section>
