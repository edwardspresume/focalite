<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Switch } from '$lib/components/ui/switch';
	import { Coffee, Settings, Target } from 'lucide-svelte';

	const focusOptions = [20, 25, 30, 45, 50, 52, 60, 75, 90];
	const breakOptions = [3, 5, 8, 10, 12, 15, 17, 20];

	let selectedFocusDuration = $state(30);
	let selectedBreakDuration = $state(3);
	let customFocusDuration = $state('');
	let customBreakDuration = $state('');
	let autoLoop = $state(false);

	const uid = $props.id();

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

<section class="rounded-2xl border bg-background p-6 shadow-lg">
	<header class="mb-6 flex items-center gap-2">
		<Settings class="size-5 text-primary" />
		<h2 class="text-lg font-semibold">Session Settings</h2>
	</header>

	<!-- Settings Grid -->
	<div class="grid gap-8 md:grid-cols-2">
		<!-- Focus Duration -->
		<fieldset class="space-y-3 rounded-xl border bg-accent p-4">
			<h3 class="flex items-center gap-2 text-sm font-medium text-muted-foreground">
				<Target class="size-4" />
				<span>Focus Duration</span>
			</h3>

			<p id="{uid}-focus-desc" class="text-xs text-muted-foreground">
				Choose a preset or enter a custom number of minutes.
			</p>

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
					class="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-xs text-muted-foreground"
					>min</span
				>
			</div>

			<p id="{uid}-focus-current" class="text-xs text-muted-foreground">
				Selected: {selectedFocusDuration} minutes
			</p>
		</fieldset>

		<!-- Break Duration -->
		<fieldset class="space-y-3 rounded-xl border bg-accent p-4">
			<h3 class="flex items-center gap-2 text-sm font-medium text-muted-foreground">
				<Coffee class="size-4" />
				<span>Break Duration</span>
			</h3>

			<p id="{uid}-break-desc" class="text-xs text-muted-foreground">
				Short breaks help you reset. Pick a preset or enter custom minutes.
			</p>

			<div class="grid grid-cols-4 gap-2 sm:grid-cols-5 md:grid-cols-6">
				{#each breakOptions as duration (duration)}
					<Button
						size="sm"
						title={`${duration} minutes`}
						class="rounded-full"
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
					type="number"
					min="1"
					max="60"
					class="pr-12"
					id="{uid}-break-custom"
					placeholder="Custom minutes"
					bind:value={customBreakDuration}
					inputmode="numeric"
					aria-describedby="{uid}-break-desc {uid}-break-current"
					onchange={handleCustomBreak}
					onkeydown={onBreakKeydown}
				/>
				<span
					class="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-xs text-muted-foreground"
					>min</span
				>
			</div>
			<p id="{uid}-break-current" class="text-xs text-muted-foreground">
				Selected: {selectedBreakDuration} minutes
			</p>
		</fieldset>
	</div>

	<!-- Behavior -->
	<div class="mt-6 rounded-xl border bg-accent p-4">
		<h3 class="mb-3 text-sm font-medium text-muted-foreground">Behavior</h3>

		<div class="flex items-start justify-between gap-4">
			<button
				class="text-left"
				aria-expanded={autoLoop}
				aria-controls="{uid}-autoloop-desc"
				onclick={() => (autoLoop = !autoLoop)}
			>
				<h4 class="font-medium text-foreground">Auto loop sessions</h4>
				<p id="{uid}-autoloop-desc" class="max-w-prose text-sm text-muted-foreground">
					Automatically start a new focus session after each break completes.
				</p>
			</button>

			<Switch aria-label="Auto loop sessions" bind:checked={autoLoop} />
		</div>
	</div>
</section>
