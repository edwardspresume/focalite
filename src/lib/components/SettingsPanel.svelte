<script lang="ts">
	import { Coffee, Moon, RefreshCw, Settings, Sun, SunMoon, Target } from 'lucide-svelte';
	import { toggleMode } from 'mode-watcher';

	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Switch } from '$lib/components/ui/switch';

	const uid = $props.id();
	const focusOptions = [20, 25, 30, 45, 50, 52, 60, 75, 90];
	const breakOptions = [3, 5, 8, 10, 12, 15, 17, 20];

	let selectedFocusDuration = $state(30);
	let selectedBreakDuration = $state(3);
	let customFocusDuration = $state('');
	let customBreakDuration = $state('');
	let autoLoop = $state(false);

	function selectFocusDuration(duration: number) {
		selectedFocusDuration = duration;
		customFocusDuration = '';
	}

	function selectBreakDuration(duration: number) {
		selectedBreakDuration = duration;
		customBreakDuration = '';
	}

	function handleCustomFocus() {
		const value = parseFloat(customFocusDuration);
		if (value && value > 0) {
			selectedFocusDuration = value;
		}
	}

	function handleCustomBreak() {
		const value = parseFloat(customBreakDuration);
		if (value && value > 0) {
			selectedBreakDuration = value;
		}
	}

	function onFocusKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') handleCustomFocus();
	}
	function onBreakKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') handleCustomBreak();
	}
</script>

<section class="rounded-lg border bg-background p-6 shadow-md dark:border-input">
	<header class="mb-6 flex items-center gap-2">
		<Settings class="size-5" />
		<h2 class="text-lg font-semibold">General Settings</h2>
	</header>

	<!-- Timer settings Grid -->
	<div class="grid gap-8 md:grid-cols-2">
		<!-- Focus Duration -->
		<fieldset class="space-y-3 rounded-md border bg-accent p-4 dark:border-input">
			<h3
				class="flex items-center gap-2 text-sm font-medium text-muted-foreground dark:text-foreground/80"
			>
				<!-- TODO: add Suitable text color for the icon -->
				<Target class="size-4" />
				<span>Focus Duration</span>
			</h3>

			<!-- TODO: Double check if there's a really good reason to why I need the ID the UID -->
			<p id="{uid}-focus-desc" class="text-xs text-muted-foreground dark:text-foreground/80">
				Choose a preset or enter custom minutes.
			</p>

			<!-- TODO: Figure out if there's a simpler way to do the grid layout that is Equivalent-->
			<div class="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
				{#each focusOptions as duration (duration)}
					<Button
						size="sm"
						class="rounded-full"
						title={`${duration} minutes`}
						aria-pressed={selectedFocusDuration === duration}
						onclick={() => selectFocusDuration(duration)}
						variant={selectedFocusDuration === duration ? 'default' : 'outline'}
					>
						{duration}m
					</Button>
				{/each}
			</div>

			<div class="relative">
				<label for="{uid}-focus-custom" class="sr-only">Custom focus minutes</label>
				<Input
					id="{uid}-focus-custom"
					bind:value={customFocusDuration}
					min="1"
					max="999"
					class="pr-12"
					type="number"
					inputmode="numeric"
					placeholder="Custom minutes"
					aria-describedby="{uid}-focus-desc {uid}-focus-current"
					onchange={handleCustomFocus}
					onkeydown={onFocusKeydown}
				/>

				<span
					class="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-xs text-muted-foreground dark:text-foreground/80"
					>min</span
				>
			</div>

			<p id="{uid}-focus-current" class="text-xs text-muted-foreground dark:text-foreground/80">
				Selected: {selectedFocusDuration} minutes
			</p>
		</fieldset>

		<!-- Break Duration -->
		<fieldset class="space-y-3 rounded-md border bg-accent p-4 dark:border-input">
			<h3
				class="flex items-center gap-2 text-sm font-medium text-muted-foreground dark:text-foreground/80"
			>
				<Coffee class="size-4" />
				<span>Break Duration</span>
			</h3>

			<p id="{uid}-break-desc" class="text-xs text-muted-foreground dark:text-foreground/80">
				Short breaks help you reset. Choose a preset or enter custom minutes.
			</p>

			<div class="grid grid-cols-4 gap-2 sm:grid-cols-5 md:grid-cols-6">
				{#each breakOptions as duration (duration)}
					<Button
						size="sm"
						class="rounded-full"
						title={`${duration} minutes`}
						aria-pressed={selectedBreakDuration === duration}
						onclick={() => selectBreakDuration(duration)}
						variant={selectedBreakDuration === duration ? 'default' : 'outline'}
					>
						{duration}m
					</Button>
				{/each}
			</div>

			<div class="relative">
				<label for="{uid}-break-custom" class="sr-only">Custom break minutes</label>
				<Input
					min="1"
					max="60"
					type="number"
					class="pr-12"
					inputmode="numeric"
					id="{uid}-break-custom"
					placeholder="Custom minutes"
					bind:value={customBreakDuration}
					aria-describedby="{uid}-break-desc {uid}-break-current"
					onchange={handleCustomBreak}
					onkeydown={onBreakKeydown}
				/>
				<span
					class="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-xs text-muted-foreground dark:text-foreground/80"
					>min</span
				>
			</div>
			<p id="{uid}-break-current" class="text-xs text-muted-foreground dark:text-foreground/80">
				Selected: {selectedBreakDuration} minutes
			</p>
		</fieldset>
	</div>

	<div
		class="mt-6 flex items-center justify-between gap-4 rounded-md border bg-accent p-4 dark:border-input"
	>
		<button
			aria-expanded={autoLoop}
			aria-controls="{uid}-autoloop-desc"
			onclick={() => (autoLoop = !autoLoop)}
		>
			<h4 class="flex items-center gap-2 font-medium text-foreground">
				<RefreshCw class="size-4" />
				<span> Auto-loop sessions </span>
			</h4>
			<p id="{uid}-autoloop-desc" class="text-sm text-muted-foreground dark:text-foreground/80">
				Automatically start a new focus session when a break ends.
			</p>
		</button>

		<Switch aria-label="Auto-loop sessions" bind:checked={autoLoop} />
	</div>

	<div
		class="mt-6 flex items-center justify-between gap-4 rounded-md border bg-accent p-4 dark:border-input"
	>
		<header>
			<h4 class="flex items-center gap-2 font-medium text-foreground">
				<SunMoon class="size-5" />
				Theme
			</h4>

			<p class="text-sm text-muted-foreground dark:text-foreground/80">
				Toggle between light and dark mode.
			</p>
		</header>

		<Button size="icon" variant="outline" onclick={toggleMode} aria-label="Toggle theme">
			<Sun class="size-[1.2rem] scale-100 rotate-0 !transition-all dark:scale-0 dark:-rotate-90" />
			<Moon
				class="absolute size-[1.2rem] scale-0 rotate-90 !transition-all dark:scale-100 dark:rotate-0"
			/>

			<span class="sr-only">Toggle theme</span>
		</Button>
	</div>
</section>
