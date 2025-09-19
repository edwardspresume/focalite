<script lang="ts">
	import FocusTimer from '$lib/components/FocusTimer.svelte';
	import SettingsPanel from '$lib/components/SettingsPanel.svelte';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import { Timer } from 'lucide-svelte';
</script>

<main class="p-6">
	<h1 class="mb-8 text-center text-4xl font-bold">Focalite</h1>

	<Tabs.Root value="focusTimer" class="w-[400px]">
		<Tabs.Content value="focusTimer">
			<FocusTimer />
		</Tabs.Content>

		<Tabs.Content value="settingsPanel">
			<SettingsPanel />
		</Tabs.Content>

		<Tabs.Content value="Progress">
			<SettingsPanel />
		</Tabs.Content>

		<Tabs.List>
			<Tabs.Trigger value="focusTimer">
				<Timer />
				<span>Timer</span>
			</Tabs.Trigger>
			<Tabs.Trigger value="settingsPanel">Settings</Tabs.Trigger>
			<Tabs.Trigger value="Progress">Progress</Tabs.Trigger>
		</Tabs.List>
	</Tabs.Root>
</main>
