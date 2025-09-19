<script lang="ts">
	import { cn } from "$lib/utils.js";
	import { Tabs as TabsPrimitive } from "bits-ui";

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: TabsPrimitive.ListProps = $props();
</script>

<TabsPrimitive.List
	bind:ref
	data-slot="tabs-list"
	class={cn(
		"bg-accent text-muted-foreground inline-flex shadow-2xl h-12 w-fit items-center justify-center rounded-4xl p-[8px]",
		className
	)}
	{...restProps}
/>
