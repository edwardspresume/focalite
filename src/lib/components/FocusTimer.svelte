<script>
	import { Play } from 'lucide-svelte';
	import Button from './ui/button/button.svelte';
</script>

<section class="grid place-items-center gap-6 rounded-xl border bg-accent p-8 shadow-lg">
	<!-- Timer Display -->
	<figure class="relative size-64">
		<svg class="size-full -rotate-90 transform" viewBox="0 0 100 100" aria-hidden="true">
			<circle
				cx="50"
				cy="50"
				r="45"
				stroke="currentColor"
				stroke-width="2"
				fill="none"
				class="text-primary"
			/>

			<circle
				cx="50"
				cy="50"
				r="45"
				stroke="currentColor"
				stroke-width="3"
				fill="none"
				stroke-dasharray="283"
				class="text-primary transition-all duration-1000 ease-linear"
				stroke-linecap="round"
			/>
		</svg>

		<figcaption class="absolute inset-0 flex flex-col items-center justify-center">
			<time class="font-mono text-6xl font-bold text-foreground">0:00</time>
			<p class="mt-2 text-sm text-muted-foreground">Ready to Focus</p>
		</figcaption>
	</figure>

	<!-- Control Buttons -->
	<div class="flex gap-4">
		<Button size="lg" class="cursor-pointer text-lg font-semibold shadow-lg hover:shadow-xl">
			<Play class="size-4" />
			Start Focus Session
		</Button>
	</div>

	<div class="flex gap-6 text-sm text-muted-foreground">
		<span>
			<kbd class="rounded bg-border px-1.5 py-0.5 font-mono text-xs text-foreground">Space</kbd>
			start/pause/resume
		</span>
		<span>
			<kbd class="rounded bg-border px-1.5 py-0.5 font-mono text-xs text-foreground">Esc</kbd> reset
		</span>
		<span>
			<kbd class="rounded bg-border px-1.5 py-0.5 font-mono text-xs text-foreground">B</kbd> start break
		</span>
	</div>
</section>
