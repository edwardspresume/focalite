<script lang="ts">
	import {
		Coffee,
		Moon,
		RefreshCw,
		Settings,
		Sun,
		SunMoon,
		Target,
		TriangleAlert
	} from 'lucide-svelte';
	import { toggleMode } from 'mode-watcher';

	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Switch } from '$lib/components/ui/switch';
	import { preferences } from '$lib/stores/preferences.svelte';
	import { timer } from '$lib/stores/timer.svelte';

	const focusOptions = [20, 25, 30, 45, 50, 60, 75, 90];
	const breakOptions = [3, 5, 8, 10, 12, 15, 17, 20];

	let customFocusDuration = $state('');
	let customBreakDuration = $state('');

	// Track whether changes will apply to next session
	const willApplyNextSession = $derived(timer.phase !== 'idle' && timer.startedAt !== null);

	function handleCustomFocus() {
		const value = String(customFocusDuration).trim();

		if (value) {
			preferences.setFocusMinutes(Number(value));
			customFocusDuration = '';
		}
	}

	function handleCustomBreak() {
		const value = String(customBreakDuration).trim();

		if (value) {
			preferences.setBreakMinutes(Number(value));
			customBreakDuration = '';
		}
	}
</script>

<section class="rounded-lg border bg-background p-6 shadow-md dark:border-input">
	<header class="mb-6 flex items-center justify-between gap-2">
		<h2 class="font-semibol gap-2 flex items-center text-lg">
			<Settings class="size-5" />
			General Settings
		</h2>

		{#if willApplyNextSession}
			<p class="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
				<TriangleAlert class="size-4" />

				<span> Timer changes will apply next session </span>
			</p>
		{/if}
	</header>

	<!-- Timer settings Grid -->
	<div class="grid gap-8 md:grid-cols-2">
		<!-- Focus Duration -->
		<fieldset class="space-y-3 rounded-md border bg-accent p-4 dark:border-input">
			<h3
				class="flex items-center gap-2 text-sm font-medium text-muted-foreground dark:text-foreground/80"
			>
				<Target class="size-4 text-primary" />
				<span>Focus Duration</span>
			</h3>

			<div class="grid grid-cols-[repeat(auto-fit,minmax(3rem,1fr))] gap-2">
				{#each focusOptions as duration (duration)}
					<Button
						size="sm"
						class="rounded-full"
						title={`${duration} minutes`}
						aria-pressed={preferences.focusMinutes === duration}
						onclick={() => preferences.setFocusMinutes(duration)}
						variant={preferences.focusMinutes === duration ? 'default' : 'outline'}
					>
						{duration}m
					</Button>
				{/each}
			</div>

			<div class="relative">
				<Input
					min="0.0166667"
					step="any"
					class="pr-12"
					type="number"
					inputmode="numeric"
					placeholder="Custom minutes"
					bind:value={customFocusDuration}
					aria-label="Custom focus duration in minutes"
					onchange={handleCustomFocus}
					onkeydown={(e) => e.key === 'Enter' && handleCustomFocus()}
				/>

				<span
					class="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-xs text-muted-foreground dark:text-foreground/80"
					>min</span
				>
			</div>

			<p class="text-xs text-muted-foreground dark:text-foreground/80">
				Selected: {preferences.focusMinutes} minutes
				{#if willApplyNextSession && timer.phase === 'focus'}
					<span class="text-amber-600 dark:text-amber-400">(next session)</span>
				{/if}
			</p>
		</fieldset>

		<!-- Break Duration -->
		<fieldset class="space-y-3 rounded-md border bg-accent p-4 dark:border-input">
			<h3
				class="flex items-center gap-2 text-sm font-medium text-muted-foreground dark:text-foreground/80"
			>
				<Coffee class="size-4 text-primary" />
				<span>Break Duration</span>
			</h3>

			<div class="grid grid-cols-[repeat(auto-fit,minmax(3rem,1fr))] gap-2">
				{#each breakOptions as duration (duration)}
					<Button
						size="sm"
						class="rounded-full"
						title={`${duration} minutes`}
						aria-pressed={preferences.breakMinutes === duration}
						onclick={() => preferences.setBreakMinutes(duration)}
						variant={preferences.breakMinutes === duration ? 'default' : 'outline'}
					>
						{duration}m
					</Button>
				{/each}
			</div>

			<div class="relative">
				<Input
					min="0.0166667"
					step="any"
					type="number"
					class="pr-12"
					inputmode="numeric"
					placeholder="Custom minutes"
					bind:value={customBreakDuration}
					aria-label="Custom break duration in minutes"
					onchange={handleCustomBreak}
					onkeydown={(e) => e.key === 'Enter' && handleCustomBreak()}
				/>
				<span
					class="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-xs text-muted-foreground dark:text-foreground/80"
					>min</span
				>
			</div>

			<p class="text-xs text-muted-foreground dark:text-foreground/80">
				Selected: {preferences.breakMinutes} minutes
				{#if willApplyNextSession && timer.phase === 'break'}
					<span class="text-amber-600 dark:text-amber-400">(next session)</span>
				{/if}
			</p>
		</fieldset>
	</div>

	<div
		class="mt-6 flex items-center justify-between gap-4 rounded-md border bg-accent p-4 dark:border-input"
	>
		<header>
			<h4 class="flex items-center gap-2 font-medium text-foreground">
				<RefreshCw class="size-4" />
				<span>Auto-loop sessions</span>
			</h4>

			<p class="text-sm text-muted-foreground dark:text-foreground/80">
				Automatically start a new focus session when a break ends.
			</p>
		</header>

		<Switch
			aria-label="Auto-loop sessions"
			bind:checked={preferences.autoLoop}
			onCheckedChange={(checked: boolean) => preferences.setAutoLoop(checked)}
		/>
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
