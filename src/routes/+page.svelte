<script lang="ts">
	import { ChartColumnIncreasing, Settings, Timer } from 'lucide-svelte';

	import FocusTimer from '$lib/components/FocusTimer.svelte';
	import SettingsPanel from '$lib/components/SettingsPanel.svelte';
	import StatsPanel from '$lib/components/StatsPanel.svelte';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
</script>

<main class="p-6">
	<h1 class="mb-10 text-center text-4xl font-bold">Focalite</h1>

	<Tabs.Root value="timer" class="gap-10">
		<Tabs.List class="mx-auto">
			<Tabs.Trigger value="timer">
				<Timer />
				<span>Timer</span>
			</Tabs.Trigger>

			<Tabs.Trigger value="settings">
				<Settings />
				<span>Settings</span>
			</Tabs.Trigger>

			<Tabs.Trigger value="stats">
				<ChartColumnIncreasing />
				<span>Stats</span>
			</Tabs.Trigger>
		</Tabs.List>

		<div class="mx-auto max-w-4xl">
			<Tabs.Content value="timer">
				<FocusTimer />
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
