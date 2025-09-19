<script lang="ts">
	import FocusTimer from '$lib/components/FocusTimer.svelte';
	import SettingsPanel from '$lib/components/SettingsPanel.svelte';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import { ChartColumnIncreasing, Settings, Timer } from 'lucide-svelte';
</script>

<main class="p-6 h-dvh">
	<h1 class="mb-8 text-center text-4xl font-bold">Focalite</h1>

	<Tabs.Root value="timer" class="w-[400px]">
		<Tabs.Content value="timer">
			<FocusTimer />
		</Tabs.Content>

		<Tabs.Content value="settings">
			<SettingsPanel />
		</Tabs.Content>

		<Tabs.Content value="progress">
			<SettingsPanel />
		</Tabs.Content>

		<Tabs.List class=''>
			<Tabs.Trigger value="timer">
				<Timer />
				<span>Timer</span>
			</Tabs.Trigger>
			<Tabs.Trigger value="settings">
				<Settings />
				<span>Settings</span>
			</Tabs.Trigger>
			<Tabs.Trigger value="progress">
				<ChartColumnIncreasing />
				<span>Progress</span>
			</Tabs.Trigger>
		</Tabs.List>
	</Tabs.Root>
</main>
