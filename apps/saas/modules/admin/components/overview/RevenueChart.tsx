"use client";

import { formatCompactCedis, formatShortDate } from "@admin/lib/overview";
import { formatMoney } from "@repo/commerce";
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@repo/ui/components/chart";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

export interface RevenuePoint {
	/** ISO date (YYYY-MM-DD) of the day in the current window. */
	date: string;
	current: number;
	previous: number;
}

const chartConfig = {
	current: { label: "This period", color: "var(--primary)" },
	previous: { label: "Previous period", color: "var(--muted-foreground)" },
} satisfies ChartConfig;

// A quiet week would otherwise draw five identical "0" ticks; give the axis
// a GH₵ 1,000 ceiling so the empty state still reads as a chart.
const EMPTY_AXIS_CEILING_IN_PESEWAS = 100_000;

export function RevenueChart({ data }: { data: RevenuePoint[] }) {
	const peak = Math.max(
		0,
		...data.map((point) => Math.max(point.current, point.previous)),
	);

	return (
		<ChartContainer
			config={chartConfig}
			className="h-[210px] w-full sm:h-[230px]"
		>
			<AreaChart
				data={data}
				margin={{ top: 8, right: 6, bottom: 0, left: 0 }}
			>
				<defs>
					<linearGradient
						id="overview-revenue-fill"
						x1="0"
						y1="0"
						x2="0"
						y2="1"
					>
						<stop
							offset="0%"
							stopColor="var(--color-current)"
							stopOpacity={0.22}
						/>
						<stop
							offset="100%"
							stopColor="var(--color-current)"
							stopOpacity={0}
						/>
					</linearGradient>
				</defs>
				<CartesianGrid
					vertical={false}
					stroke="var(--border)"
					strokeOpacity={0.7}
				/>
				<XAxis
					dataKey="date"
					tickFormatter={formatShortDate}
					minTickGap={48}
					tickMargin={10}
					axisLine={false}
					tickLine={false}
					tick={{ fontSize: 11 }}
				/>
				<YAxis
					tickFormatter={formatCompactCedis}
					domain={[
						0,
						peak > 0 ? "auto" : EMPTY_AXIS_CEILING_IN_PESEWAS,
					]}
					allowDecimals={false}
					width={38}
					tickCount={5}
					axisLine={false}
					tickLine={false}
					tick={{ fontSize: 11 }}
				/>
				<ChartTooltip
					cursor={{ stroke: "var(--border)" }}
					content={
						<ChartTooltipContent
							labelFormatter={(label) =>
								typeof label === "string"
									? formatShortDate(label)
									: label
							}
							formatter={(value, name) => (
								<span className="flex w-full items-center justify-between gap-4">
									<span className="text-muted-foreground">
										{chartConfig[
											name as keyof typeof chartConfig
										]?.label ?? name}
									</span>
									<span className="font-medium tabular-nums">
										{formatMoney(Number(value))}
									</span>
								</span>
							)}
						/>
					}
				/>
				<Area
					type="monotone"
					dataKey="previous"
					stroke="var(--color-previous)"
					strokeOpacity={0.4}
					strokeWidth={1.5}
					strokeDasharray="4 5"
					fill="transparent"
					dot={false}
					activeDot={false}
					isAnimationActive={false}
				/>
				<Area
					type="monotone"
					dataKey="current"
					stroke="var(--color-current)"
					strokeWidth={2.25}
					fill="url(#overview-revenue-fill)"
					dot={false}
					activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--card)" }}
					isAnimationActive={false}
				/>
			</AreaChart>
		</ChartContainer>
	);
}
