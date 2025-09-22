<script lang="ts">
	import { timer, type TimerPhase } from '$lib/stores/timer.svelte';
	import { Activity, ChartColumnIncreasing, Settings, Timer } from 'lucide-svelte';

	import BreakTimer from '$lib/components/BreakTimer.svelte';
	import FocusTimer from '$lib/components/FocusTimer.svelte';
	import SettingsPanel from '$lib/components/SettingsPanel.svelte';
	import StatsPanel from '$lib/components/StatsPanel.svelte';
	import * as Tabs from '$lib/components/ui/tabs/index.js';

	// Auto-loop is now handled in the timer store

	// Tab management - only auto-switch when timer phase actually changes
	let activeTab = $state('timer');
	let lastPhase = $state<TimerPhase>(timer.phase);

	$effect(() => {
		const phase = timer.phase;

		if (phase === lastPhase) return;

		lastPhase = phase;

		if (phase === 'break') {
			activeTab = 'break';
			return;
		}

		// Manual cycles return the UI to the timer when the break completes.
		// Focus transitions should also snap the UI back to the timer tab.
		if (phase === 'focus' || (phase === 'idle' && timer.isManualCycle)) {
			activeTab = 'timer';
		}
	});
</script>

<main class="p-8">
	<Tabs.Root value={activeTab} class="gap-10">
		<Tabs.List class="mx-auto">
			<Tabs.Trigger value="timer" onclick={() => (activeTab = 'timer')}>
				<Timer />
				<span>Timer</span>
			</Tabs.Trigger>

			<Tabs.Trigger value="break" onclick={() => (activeTab = 'break')}>
				<Activity />
				<span>Break</span>
			</Tabs.Trigger>

			<Tabs.Trigger value="stats" onclick={() => (activeTab = 'stats')}>
				<ChartColumnIncreasing />
				<span>Stats</span>
			</Tabs.Trigger>

			<Tabs.Trigger value="settings" onclick={() => (activeTab = 'settings')}>
				<Settings />
				<span>Settings</span>
			</Tabs.Trigger>
		</Tabs.List>

		<div class="mx-auto max-w-4xl">
			<Tabs.Content value="timer">
				<FocusTimer isActive={activeTab === 'timer'} />
			</Tabs.Content>

			<Tabs.Content value="break">
				<BreakTimer isActive={activeTab === 'break'} />
			</Tabs.Content>

			<Tabs.Content value="stats">
				<StatsPanel />
			</Tabs.Content>

			<Tabs.Content value="settings">
				<SettingsPanel />
			</Tabs.Content>
		</div>
	</Tabs.Root>
</main>
