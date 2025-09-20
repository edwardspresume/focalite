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
		"bg-background text-muted-foreground border inline-flex shadow-lg h-12 w-fit items-center justify-center rounded-xl p-[8px] gap-2",
		className
	)}
	{...restProps}
/>
