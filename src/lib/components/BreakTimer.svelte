<script>
	import { Activity, Pause, Square } from 'lucide-svelte';
	import Button from './ui/button/button.svelte';
</script>

<div class="space-y-6">
	<!-- Break Timer Section -->
	<section class="grid place-items-center gap-6 rounded-lg border bg-background p-8 shadow-md">
		<!-- Header -->
		<div class="text-center">
			<div class="mb-2 flex items-center justify-center gap-2 text-primary">
				<Activity class="size-5" />
				<h2 class="text-lg font-semibold text-primary">Time to move!</h2>
			</div>
			<p class="text-sm text-muted-foreground">Get up, stretch your legs, and take a refreshing walk</p>
		</div>

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
				<p class="mt-2 text-sm text-muted-foreground">Break Time</p>
			</figcaption>
		</figure>

		<!-- Control Buttons -->
		<div class="flex gap-4">
			<Button variant="outline" size="lg" class="cursor-pointer shadow-sm hover:shadow-md">
				<Pause class="size-4" />
				Pause
			</Button>
			<Button variant="destructive" size="lg" class="cursor-pointer shadow-sm hover:shadow-md">
				<Square class="size-4" />
				End Break Early
			</Button>
		</div>

		<!-- Keyboard Shortcuts -->
		<div class="flex gap-6 text-sm text-muted-foreground">
			<span>
				<kbd class="rounded-sm bg-border px-1.5 py-0.5 font-mono text-xs text-foreground">Space</kbd>
				start/pause/resume
			</span>
			<span>
				<kbd class="rounded-sm bg-border px-1.5 py-0.5 font-mono text-xs text-foreground">Esc</kbd>
				end break
			</span>
			<span>
				<kbd class="rounded-sm bg-border px-1.5 py-0.5 font-mono text-xs text-foreground">B</kbd>
				start break
			</span>
		</div>
	</section>

	<!-- Break Suggestions Section -->
	<section class="rounded-lg border bg-background p-6 shadow-md">
		<header class="mb-4 flex items-center gap-2">
			<Activity class="size-5 text-primary" />
			<h3 class="text-lg font-semibold">Break Suggestions</h3>
		</header>

		<div class="grid gap-4 md:grid-cols-2">
			<!-- Physical Movement Card -->
			<div class="rounded-md border bg-primary/10 p-4 shadow-sm">
				<h4 class="mb-3 font-medium text-foreground">Physical Movement</h4>
				<ul class="space-y-2 text-sm text-muted-foreground">
					<li>• Take a short walk</li>
					<li>• Do some stretches</li>
					<li>• Practice deep breathing</li>
				</ul>
			</div>

			<!-- Mental Rest Card -->
			<div class="rounded-md border bg-primary/10 p-4 shadow-sm">
				<h4 class="mb-3 font-medium text-foreground">Mental Rest</h4>
				<ul class="space-y-2 text-sm text-muted-foreground">
					<li>• Look out the window</li>
					<li>• Hydrate with water</li>
					<li>• Practice mindfulness</li>
				</ul>
			</div>
		</div>
	</section>
</div>