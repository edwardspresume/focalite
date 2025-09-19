<script lang="ts">
	import { scaleBand } from 'd3-scale';
	import { BarChart } from 'layerchart';

	import * as Chart from '$lib/components/ui/chart/index.js';
	import { BarChart as BarChartIcon } from 'lucide-svelte';

	// Placeholder data for weekly chart
	const chartData = [
		{ day: 'Mon', minutes: 120 },
		{ day: 'Tue', minutes: 90 },
		{ day: 'Wed', minutes: 150 },
		{ day: 'Thu', minutes: 180 },
		{ day: 'Fri', minutes: 210 },
		{ day: 'Sat', minutes: 60 },
		{ day: 'Sun', minutes: 45 }
	];

	const chartConfig = {
		minutes: {
			label: 'Focus Minutes',
			color: 'hsl(var(--primary))'
		}
	} satisfies Chart.ChartConfig;

	// Placeholder stats
	const todayStats = {
		sessions: 8,
		focusTime: 240, // in minutes
		breaks: 7
	};

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

<div class="space-y-6 p-6">
	<!-- Daily Stats Cards -->
	<div>
		<h3 class="text-lg font-semibold mb-4">Today's Overview</h3>
		<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
			<!-- Sessions Card -->
			<div class="bg-card rounded-lg border p-4">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm text-muted-foreground">Sessions</p>
						<p class="text-2xl font-bold">{todayStats.sessions}</p>
					</div>
					<div class="rounded-full bg-primary/10 p-3">
						<div class="h-5 w-5 text-primary">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							>
								<circle cx="12" cy="12" r="10" />
								<path d="M12 6v6l4 2" />
							</svg>
						</div>
					</div>
				</div>
				<p class="text-xs text-muted-foreground mt-2">Completed today</p>
			</div>

			<!-- Focus Time Card -->
			<div class="bg-card rounded-lg border p-4">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm text-muted-foreground">Focus Time</p>
						<p class="text-2xl font-bold">{formatTime(todayStats.focusTime)}</p>
					</div>
					<div class="rounded-full bg-blue-500/10 p-3">
						<div class="h-5 w-5 text-blue-500">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							>
								<path d="M12 2v20" />
								<path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
							</svg>
						</div>
					</div>
				</div>
				<p class="text-xs text-muted-foreground mt-2">Total focus duration</p>
			</div>

			<!-- Breaks Card -->
			<div class="bg-card rounded-lg border p-4">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm text-muted-foreground">Breaks</p>
						<p class="text-2xl font-bold">{todayStats.breaks}</p>
					</div>
					<div class="rounded-full bg-green-500/10 p-3">
						<div class="h-5 w-5 text-green-500">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							>
								<path d="M17 21v-2a4 4 0 0 0-4-4H5" />
								<path d="M17 21v-2a4 4 0 0 0-4-4H5" />
								<path d="M21 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v3" />
								<circle cx="9" cy="12" r="1" />
								<circle cx="15" cy="12" r="1" />
							</svg>
						</div>
					</div>
				</div>
				<p class="text-xs text-muted-foreground mt-2">Breaks taken</p>
			</div>
		</div>
	</div>

	<!-- Weekly Chart -->
	<div>
		<div class="mb-4 flex items-center justify-between">
			<h3 class="text-lg font-semibold">Weekly Activity</h3>
			<div class="flex items-center gap-2 text-sm text-muted-foreground">
				<BarChartIcon class="h-4 w-4" />
				<span>Focus Minutes</span>
			</div>
		</div>
		<div class="rounded-lg border bg-card p-6">
			<Chart.Container config={chartConfig} class="h-[250px] w-full">
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
