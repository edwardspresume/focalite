<script lang="ts">
	import { Activity, ChartColumnIncreasing, Settings, Timer } from 'lucide-svelte';
	import { timer } from '$lib/stores/timer.svelte';
	import { preferences } from '$lib/stores/preferences.svelte';
	import { progress } from '$lib/stores/progress.svelte';

	import BreakTimer from '$lib/components/BreakTimer.svelte';
	import FocusTimer from '$lib/components/FocusTimer.svelte';
	import SettingsPanel from '$lib/components/SettingsPanel.svelte';
	import StatsPanel from '$lib/components/StatsPanel.svelte';
	import * as Tabs from '$lib/components/ui/tabs/index.js';

	// Initialize progress store (just by importing and using it)
	$effect(() => {
		// This ensures the progress store is initialized
		void progress.loaded;
	});

	// Auto-loop is now handled in the timer store

	// Tab management - only auto-switch when timer phase actually changes
	let activeTab = $state('timer');
	let lastPhase = $state<typeof timer.phase | null>(null);

	$effect(() => {
		// Only auto-switch tabs when phase changes (not just when viewing tabs)
		if (timer.phase !== lastPhase) {
			lastPhase = timer.phase;

			// Auto-switch to break tab when break actually starts
			if (timer.phase === 'break') {
				activeTab = 'break';
			}
			// Auto-switch back to timer tab when transitioning to focus or idle
			else if (timer.phase === 'focus' || timer.phase === 'idle') {
				activeTab = 'timer';
			}
		}
	});
</script>

<main class="p-6">

	<Tabs.Root value={activeTab} class="gap-10">
		<Tabs.List class="mx-auto">
			<Tabs.Trigger value="timer" onclick={() => activeTab = 'timer'}>
				<Timer />
				<span>Timer</span>
			</Tabs.Trigger>

			<Tabs.Trigger value="break" onclick={() => activeTab = 'break'}>
				<Activity />
				<span>Break</span>
			</Tabs.Trigger>

			<Tabs.Trigger value="settings" onclick={() => activeTab = 'settings'}>
				<Settings />
				<span>Settings</span>
			</Tabs.Trigger>

			<Tabs.Trigger value="stats" onclick={() => activeTab = 'stats'}>
				<ChartColumnIncreasing />
				<span>Stats</span>
			</Tabs.Trigger>
		</Tabs.List>

		<div class="mx-auto max-w-4xl">
			<Tabs.Content value="timer">
				<FocusTimer />
			</Tabs.Content>

			<Tabs.Content value="break">
				<BreakTimer />
			</Tabs.Content>

			<Tabs.Content value="settings">
				<SettingsPanel />
			</Tabs.Content>

			<Tabs.Content value="stats">
				<StatsPanel />
			</Tabs.Content>
		</div>
	</Tabs.Root>
</main>
