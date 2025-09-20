<script>
	import { Play } from 'lucide-svelte';
	import Button from './ui/button/button.svelte';
</script>

<section
	class="grid place-items-center gap-8 rounded-lg border bg-background p-8 shadow-md dark:border-input"
>
	<!-- Timer Display -->
	<figure class="relative size-72">
		<!-- TODO: check if i need the classes once i get the timer ticker working -->
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
			<time class="font-mono text-6xl font-bold text-foreground">30:00</time>
			<p class="mt-2 text-sm text-muted-foreground dark:text-foreground/80">Ready to focus</p>
		</figcaption>
	</figure>

	<!-- Control Buttons -->
	<div class="flex gap-4">
		<Button size="lg" class="text-lg font-semibold shadow-sm hover:shadow-md">
			<Play class="size-4" />
			Start Focus
		</Button>
	</div>

	<div class="flex gap-6 text-sm text-muted-foreground dark:text-foreground/80">
		<!-- TODO: turn this into a snippet -->
		<span>
			<kbd
				class="rounded-sm bg-border px-1.5 py-0.5 font-mono text-xs text-foreground dark:bg-muted"
			>
				Space
			</kbd>
			Start/Pause/Resume
		</span>

		<span>
			<kbd
				class="rounded-sm bg-border px-1.5 py-0.5 font-mono text-xs text-foreground dark:bg-muted"
				>Esc</kbd
			>
			Reset
		</span>

		<span>
			<kbd
				class="rounded-sm bg-border px-1.5 py-0.5 font-mono text-xs text-foreground dark:bg-muted"
				>B</kbd
			>
			Start Break
		</span>
	</div>
</section>
