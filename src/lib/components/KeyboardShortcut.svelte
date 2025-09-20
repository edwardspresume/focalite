<script lang="ts">
	interface Props {
		key: string;
		label: string;
	}

	let { key, label }: Props = $props();
</script>

<span>
	<kbd class="rounded-sm bg-border px-1.5 py-0.5 font-mono text-xs text-foreground dark:bg-muted">
		{key}
	</kbd>
	{label}
</span>
