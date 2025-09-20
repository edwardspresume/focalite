<script>
	import { Activity, Pause, Square } from 'lucide-svelte';
	import Button from './ui/button/button.svelte';
	import KeyboardShortcut from './KeyboardShortcut.svelte';
</script>

<div class="space-y-6">
	<!-- Break Timer Section -->
	<section
		class="grid place-items-center gap-6 rounded-lg border bg-background p-8 shadow-md dark:border-input"
	>
		<header>
			<h2 class="mb-2 flex items-center justify-center gap-2 text-lg font-semibold text-primary">
				<Activity class="size-5" aria-hidden="true" />
				<span>Time to move</span>
			</h2>

			<p class="text-sm text-muted-foreground dark:text-foreground/80">
				Stand up, stretch, or take a short walk.
			</p>
		</header>

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
					stroke-dashoffset="100"
					class="text-primary transition-all duration-1000 ease-linear"
					stroke-linecap="round"
				/>
			</svg>

			<figcaption class="absolute inset-0 flex flex-col items-center justify-center">
				<time class="font-mono text-6xl font-bold text-foreground">2:57</time>
				<p class="mt-2 text-sm text-muted-foreground dark:text-foreground/80">On break</p>
			</figcaption>
		</figure>

		<!-- Control Buttons -->
		<div class="flex gap-4">
			<Button variant="outline" size="lg">
				<Pause class="size-4" />
				Pause
			</Button>
			<Button variant="destructive" size="lg">
				<Square class="size-4" />
				End Break
			</Button>
		</div>

		<!-- Keyboard Shortcuts -->
		<div class="flex gap-6 text-sm text-muted-foreground dark:text-foreground/80">
			<KeyboardShortcut key="Space" label="Start/Pause/Resume" />
			<KeyboardShortcut key="Esc" label="End Break" />
		</div>
	</section>

	<!-- Break Suggestions Section -->
	<section class="rounded-lg border bg-background p-6 shadow-md dark:border-input">
		<h3 class="mb-4 flex items-center gap-2 text-lg font-semibold">
			<Activity class="size-5 text-primary" />
			<span>Break Suggestions</span>
		</h3>

		<div class="grid gap-4 md:grid-cols-2">
			<!-- Physical Movement Card -->
			<div
				class="rounded-md border bg-primary/20 p-4 shadow-sm dark:border-primary/40 dark:bg-primary/30"
			>
				<h4 class="mb-3 font-medium text-foreground">Physical Movement</h4>
				<ul class="list-disc space-y-2 pl-4 text-sm text-muted-foreground dark:text-foreground/80">
					<li>Take a short walk</li>
					<li>Stretch neck, shoulders, and wrists</li>
					<li>Do 10–15 squats or calf raises</li>
				</ul>
			</div>

			<!-- Mental Rest Card -->
			<div
				class="rounded-md border bg-primary/20 p-4 shadow-sm dark:border-primary/40 dark:bg-primary/30"
			>
				<h4 class="mb-3 font-medium text-foreground">Mental Rest</h4>
				<ul class="list-disc space-y-2 pl-4 text-sm text-muted-foreground dark:text-foreground/80">
					<li>Drink water</li>
					<li>Box breathing (4-4-4-4)</li>
					<li>Follow the 20-20-20 rule (eyes)</li>
				</ul>
			</div>
		</div>
	</section>
</div>
