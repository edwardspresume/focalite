<script lang="ts">
	import { scaleBand } from 'd3-scale';
	import { BarChart } from 'layerchart';

	import * as Chart from '$lib/components/ui/chart/index.js';
	import { ChartNoAxesColumnIncreasing, CircleCheckBig, Coffee, Target } from 'lucide-svelte';

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
            color: 'color-mix(in oklch, var(--primary) 70%, white)'
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
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <!-- Sessions Card -->
            <div class="bg-background rounded-md border p-4 shadow-sm">
                <div class="flex items-center gap-4">
                    <div class="shrink-0 rounded-lg bg-primary/10 p-3 text-primary">
                        <CircleCheckBig class="h-5 w-5" />
                    </div>
                    <div class="min-w-0">
                        <p class="text-sm text-muted-foreground">Sessions</p>
                        <p class="truncate text-3xl font-semibold leading-tight">{todayStats.sessions}</p>
                        <p class="text-xs text-muted-foreground mt-1">Completed today</p>
                    </div>
                </div>
            </div>

            <!-- Focus Time Card -->
            <div class="bg-background rounded-md border p-4 shadow-sm">
                <div class="flex items-center gap-4">
                    <div class="shrink-0 rounded-lg bg-blue-500/10 p-3 text-blue-600 dark:text-blue-400">
                        <Target class="h-5 w-5" />
                    </div>
                    <div class="min-w-0">
                        <p class="text-sm text-muted-foreground">Focus Time</p>
                        <p class="truncate text-3xl font-semibold leading-tight">{formatTime(todayStats.focusTime)}</p>
                        <p class="text-xs text-muted-foreground mt-1">Total focus duration</p>
                    </div>
                </div>
            </div>

            <!-- Breaks Card -->
            <div class="bg-background rounded-md border p-4 shadow-sm">
                <div class="flex items-center gap-4">
                    <div class="shrink-0 rounded-lg bg-green-500/10 p-3 text-green-600 dark:text-green-400">
                        <Coffee class="h-5 w-5" />
                    </div>
                    <div class="min-w-0">
                        <p class="text-sm text-muted-foreground">Breaks</p>
                        <p class="truncate text-3xl font-semibold leading-tight">{todayStats.breaks}</p>
                        <p class="text-xs text-muted-foreground mt-1">Breaks taken</p>
                    </div>
                </div>
            </div>
        </div>
    </div>

	<!-- Weekly Chart -->
	<div>
		<div class="mb-4 flex items-center justify-between">
			<h3 class="text-lg font-semibold">Weekly Activity</h3>
			<div class="flex items-center gap-2 text-sm text-muted-foreground">
				<ChartNoAxesColumnIncreasing class="h-4 w-4" />
				<span>Focus Minutes</span>
			</div>
		</div>
		<div class="rounded-md border bg-background p-6 shadow-sm">
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
