<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Switch } from '$lib/components/ui/switch';
	import { Clock, Settings, Timer } from 'lucide-svelte';

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
</script>

<section class="rounded-xl border bg-accent p-8 shadow-lg">
	<header class="mb-6 flex items-center gap-2">
		<Settings class="size-5" />
		<h2 class="text-lg font-semibold">Session Settings</h2>
	</header>

	<!-- Focus Duration Section -->
	<div class="mb-8">
		<div class="mb-4 flex items-center gap-2">
			<Clock class="h-4 w-4" />
			<h3 class="font-medium">Focus Duration</h3>
		</div>

		<div class="mb-4 grid grid-cols-3 gap-2">
			{#each focusOptions as duration (duration)}
				<Button
					variant={selectedFocusDuration === duration ? 'default' : 'outline'}
					size="sm"
					onclick={() => selectFocusDuration(duration)}
					class="transition-all"
				>
					{duration}m
				</Button>
			{/each}
		</div>

		<div class="flex items-center gap-2">
			<Input
				bind:value={customFocusDuration}
				placeholder="Custom minutes"
				type="number"
				min="1"
				max="999"
				class="flex-1"
				onchange={handleCustomFocus}
			/>
			<span class="text-sm text-muted-foreground">minutes</span>
		</div>
		<p class="mt-2 text-xs text-muted-foreground">
			Current: {selectedFocusDuration} minutes
		</p>
	</div>

	<!-- Break Duration Section -->
	<div class="mb-8">
		<div class="mb-4 flex items-center gap-2">
			<Timer class="h-4 w-4" />
			<h3 class="font-medium">Break Duration</h3>
		</div>

		<div class="mb-4 grid grid-cols-4 gap-2">
			{#each breakOptions as duration (duration)}
				<Button
					variant={selectedBreakDuration === duration ? 'default' : 'outline'}
					size="sm"
					onclick={() => selectBreakDuration(duration)}
					class="transition-all"
				>
					{duration}m
				</Button>
			{/each}
		</div>

		<div class="flex items-center gap-2">
			<Input
				bind:value={customBreakDuration}
				placeholder="Custom minutes"
				type="number"
				min="1"
				max="60"
				class="flex-1"
				onchange={handleCustomBreak}
			/>
			<span class="text-sm text-muted-foreground">minutes</span>
		</div>
		<p class="mt-2 text-xs text-muted-foreground">
			Current: {selectedBreakDuration} minutes
		</p>
	</div>

	<!-- Auto Loop Section -->
	<div class="flex items-center justify-between">
		<div>
			<h3 class="font-medium">Auto loop sessions</h3>
			<p class="text-sm text-muted-foreground">
				Automatically start a new focus session after each break completes
			</p>
		</div>
		<Switch bind:checked={autoLoop} />
	</div>
</section>
