<script lang="ts">
	import { scaleBand } from 'd3-scale';
	import { BarChart } from 'layerchart';
	import {
		ChartNoAxesColumnIncreasing,
		CircleCheckBig,
		Coffee,
		RotateCcw,
		Target,
		type Icon as IconType
	} from 'lucide-svelte';
	import { timer } from '$lib/stores/timer.svelte';
	import { progress } from '$lib/stores/progress.svelte';

	import * as Chart from '$lib/components/ui/chart/index.js';
	import Button from './ui/button/button.svelte';

	// Chart data - will be populated with real data when available
	let chartData = $state([
		{ day: 'Mon', minutes: 0 },
		{ day: 'Tue', minutes: 0 },
		{ day: 'Wed', minutes: 0 },
		{ day: 'Thu', minutes: 0 },
		{ day: 'Fri', minutes: 0 },
		{ day: 'Sat', minutes: 0 },
		{ day: 'Sun', minutes: 0 }
	]);

	const chartConfig = {
		minutes: {
			label: 'Focus Minutes',
			color: 'color-mix(in oklch, var(--primary) 70%, white)'
		}
	} satisfies Chart.ChartConfig;

	// Real-time stats derived from timer store
	const todayStats = $derived.by(() => {
		const completionRate = timer.sessionsCompleted > 0 ?
			Math.round((timer.sessionsCompleted / (timer.sessionsCompleted + Math.max(0, timer.totalFocusTime / 25 - timer.sessionsCompleted))) * 100) : 100;

		const avgBreakTime = timer.breaksCompleted > 0 ?
			Math.round(timer.totalBreakTime / timer.breaksCompleted) : 0;

		return {
			focusTodayMin: timer.totalFocusTime,
			focusWtdMicro: `${timer.sessionsCompleted} sessions completed`,
			completionRate,
			completionMicro: `${timer.sessionsCompleted} focus sessions`,
			streakCurrentDays: 1, // TODO: Calculate from historical data
			streakBestDays: 1, // TODO: Calculate from historical data
			breakAdherence: timer.breaksCompleted > 0 ? 95 : 100, // Placeholder calculation
			breakMicro: `Avg break ${avgBreakTime}m`
		};
	});

	// Load historical data for chart
	$effect(() => {
		if (progress.loaded) {
			progress.getHistoricalProgress(7).then(data => {
				const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
				const today = new Date();

				// Generate last 7 days
				chartData = Array.from({ length: 7 }, (_, i) => {
					const date = new Date(today);
					date.setDate(date.getDate() - (6 - i));
					const dayName = dayNames[date.getDay()];
					const dateStr = date.toISOString().split('T')[0];

					const dayData = data.find(d => d.date === dateStr);
					return {
						day: dayName,
						minutes: dayData?.focusMinutes || 0
					};
				});
			});
		}
	});

	// Convert minutes to hours and minutes
	function formatTime(minutes: number): string {
		const hours = Math.floor(minutes / 60);
		const mins = minutes % 60;
		if (hours > 0) {
			return `${hours}h ${mins}m`;
		}
		return `${mins}m`;
	}
</script>

{#snippet metricCard(
	Icon: typeof IconType,
	iconColorClasses: string,
	title: string,
	value: string,
	subtitle: string
)}
	<article
		class="flex items-center gap-4 rounded-md border bg-background p-3 shadow-sm dark:border-input"
	>
		<div class="shrink-0 rounded-lg p-3 {iconColorClasses}">
			<Icon class="size-5" />
		</div>

		<div>
			<p class="text-sm text-muted-foreground dark:text-foreground/80">{title}</p>
			<p class="truncate text-3xl leading-tight font-semibold">
				{value}
			</p>
			<p class="mt-1 text-xs text-muted-foreground dark:text-foreground/80">
				{subtitle}
			</p>
		</div>
	</article>
{/snippet}

<div class="space-y-6">
	<!-- Daily Stats Section -->
	<section>
		<div class="mb-4 flex items-center justify-between">
			<h3 class="text-lg font-semibold">Today's Focus</h3>
			<Button
				size="sm"
				variant="outline"
				onclick={progress.resetProgress}
				class="text-sm font-medium"
			>
				<RotateCcw class="size-4" />
				Reset Progress
			</Button>
		</div>

		<div class="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-4">
			{@render metricCard(
				Target,
				'bg-blue-500/10 text-blue-600 dark:bg-blue-400/15 dark:text-blue-400',
				'Focus Time',
				formatTime(todayStats.focusTodayMin),
				todayStats.focusWtdMicro
			)}

			{@render metricCard(
				CircleCheckBig,
				'bg-primary/10 text-primary dark:bg-primary/20',
				'Completion Rate',
				`${todayStats.completionRate}%`,
				todayStats.completionMicro
			)}

			{@render metricCard(
				ChartNoAxesColumnIncreasing,
				'bg-amber-500/10 text-amber-600 dark:bg-amber-400/15 dark:text-amber-400',
				'Consistency Streak',
				`${todayStats.streakCurrentDays}d · ${todayStats.streakBestDays}d`,
				'Current · Best'
			)}

			{@render metricCard(
				Coffee,
				'bg-green-500/10 text-green-600 dark:bg-green-400/15 dark:text-green-400',
				'Break Adherence',
				`${todayStats.breakAdherence}%`,
				todayStats.breakMicro
			)}
		</div>
	</section>

	<!-- Weekly Chart -->
	<div>
		<header class="mb-4 flex items-center justify-between">
			<h3 class="text-lg font-semibold">Weekly Overview</h3>

			<h4 class="flex items-center gap-2 text-sm text-muted-foreground dark:text-foreground/80">
				<ChartNoAxesColumnIncreasing class="size-4" />
				<span>Focus Minutes</span>
			</h4>
		</header>

		<div class="rounded-md border bg-background p-6 shadow-sm dark:border-input">
			<Chart.Container config={chartConfig} class="h-[240px] ">
				<BarChart
					data={chartData}
					xScale={scaleBand().padding(0.3)}
					x="day"
					y="minutes"
					axis="x"
					series={[
						{
							key: 'minutes',
							label: chartConfig.minutes.label,
							color: chartConfig.minutes.color
						}
					]}
					props={{
						xAxis: {
							format: (d) => d
						}
					}}
				>
					{#snippet tooltip()}
						<Chart.Tooltip />
					{/snippet}
				</BarChart>
			</Chart.Container>
		</div>
	</div>
</div>
