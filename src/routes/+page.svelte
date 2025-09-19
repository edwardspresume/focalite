<script lang="ts">
	import FocusTimer from '$lib/components/FocusTimer.svelte';
	import SettingsPanel from '$lib/components/SettingsPanel.svelte';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import { ChartColumnIncreasing, Settings, Timer } from 'lucide-svelte';
</script>

<main class="p-6 h-dvh flex flex-col">
	<h1 class="mb-8 text-center text-4xl font-bold">Focalite</h1>

	<Tabs.Root value="timer" class="h-full flex flex-col justify-between">
		<div class="max-w-4xl mx-auto">
			<Tabs.Content value="timer">
				<FocusTimer />
			</Tabs.Content>

			<Tabs.Content value="settings">
				<SettingsPanel />
			</Tabs.Content>

			<Tabs.Content value="progress">
				<SettingsPanel />
			</Tabs.Content>
		</div>

		<Tabs.List class="mx-auto">
			<Tabs.Trigger value="timer">
				<Timer />
				<span>Timer</span>
			</Tabs.Trigger>
			<Tabs.Trigger value="settings">
				<Settings />
				<span>Settings</span>
			</Tabs.Trigger>
			<Tabs.Trigger value="progress">
				<ChartColumnIncreasing class='text-primary' />
				<span>Progress</span>
			</Tabs.Trigger>
		</Tabs.List>
	</Tabs.Root>
</main>
