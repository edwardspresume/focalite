<script lang="ts">
	import type { DailyProgress } from '$lib/stores/progress.svelte';
	import { progress } from '$lib/stores/progress.svelte';
	import { timer } from '$lib/stores/timer.svelte';
	import { scaleBand } from 'd3-scale';
	import { BarChart } from 'layerchart';
	import {
		ChartNoAxesColumnIncreasing,
		CircleCheckBig,
		Coffee,
		Target,
		type Icon as IconType
	} from 'lucide-svelte';

	import * as Chart from '$lib/components/ui/chart/index.js';

	const chartConfig = {
		minutes: {
			label: 'Focus Minutes',
			color: 'color-mix(in oklch, var(--primary) 70%, white)'
		}
	} satisfies Chart.ChartConfig;

	const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
	const STREAK_WINDOW_DAYS = 30;
	const CHART_DAYS = 7;

	let historicalWindow = $state<DailyProgress[]>([]);

	const chartData = $derived.by(() => {
		const data = historicalWindow.length > 0
			? historicalWindow.slice(-CHART_DAYS)
			: Array.from({ length: CHART_DAYS }, (_, i) => ({
				date: new Date(Date.now() - (CHART_DAYS - 1 - i) * 86400000).toISOString().split('T')[0],
				focusMinutes: 0,
				sessionsCompleted: 0,
				breaksCompleted: 0,
				breakMinutes: 0
			}));

		return data.map((entry) => ({
			day: DAY_NAMES[new Date(`${entry.date}T00:00:00`).getDay()],
			minutes: entry.focusMinutes
		}));
	});

	const streaks = $derived.by(() => calculateStreaks(historicalWindow));

	const todayStats = $derived.by(() => {
		const expectedSessions = Math.floor(timer.totalFocusTime / 25) || timer.sessionsCompleted;
		const completionRate = expectedSessions > 0
			? Math.round((timer.sessionsCompleted / expectedSessions) * 100)
			: 100;

		const avgBreakTime =
			timer.breaksCompleted > 0 ? Math.round(timer.totalBreakTime / timer.breaksCompleted) : 0;

		const breakAdherence = timer.sessionsCompleted > 0
			? Math.round((timer.breaksCompleted / timer.sessionsCompleted) * 100)
			: 100;

		return {
			focusTodayMin: timer.totalFocusTime,
			focusWtdMicro: `${timer.sessionsCompleted} sessions completed`,
			completionRate,
			completionMicro: `${timer.sessionsCompleted} focus sessions`,
			streakCurrentDays: streaks.current,
			streakBestDays: streaks.best,
			breakAdherence,
			breakMicro: `Avg break ${avgBreakTime}m`
		};
	});

	$effect(() => {
		if (!progress.loaded) {
			return;
		}

		void timer.sessionsCompleted;
		void timer.breaksCompleted;
		void timer.totalFocusTime;
		void timer.totalBreakTime;
		void timer.lastCompletionAt;
		void progress.currentDate;

		let cancelled = false;

		progress
			.getDailyWindow(STREAK_WINDOW_DAYS, { includeToday: true })
			.then((window) => {
				if (!cancelled) {
					historicalWindow = window;
				}
			});

		return () => {
			cancelled = true;
		};
	});

	function formatTime(minutes: number): string {
		const hours = Math.floor(minutes / 60);
		const mins = minutes % 60;
		if (hours > 0) {
			return `${hours}h ${mins}m`;
		}
		return `${mins}m`;
	}

	function calculateStreaks(days: DailyProgress[]) {
		if (!days.length) return { current: 0, best: 0 };

		const hasFocus = (day: DailyProgress) => day.focusMinutes > 0;

		let best = 0;
		let running = 0;

		// Calculate best streak
		for (const day of days) {
			running = hasFocus(day) ? running + 1 : 0;
			best = Math.max(best, running);
		}

		// Calculate current streak (from end)
		let current = 0;
		for (let i = days.length - 1; i >= 0 && hasFocus(days[i]); i--) {
			current++;
		}

		return { current, best };
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
		<h3 class="mb-4 text-lg font-semibold">Today's Focus</h3>

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
			<Chart.Container config={chartConfig} class="h-[240px] w-full">
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
