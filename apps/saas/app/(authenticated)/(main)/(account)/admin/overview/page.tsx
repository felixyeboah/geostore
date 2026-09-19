import {
	type AttentionItem,
	AttentionQueue,
} from "@admin/components/overview/AttentionQueue";
import { BestSellers } from "@admin/components/overview/BestSellers";
import { MetricTile } from "@admin/components/overview/MetricTile";
import { RangeToggle } from "@admin/components/overview/RangeToggle";
import { RecentOrdersTable } from "@admin/components/overview/RecentOrdersTable";
import { RevenueChart } from "@admin/components/overview/RevenueChart";
import { RunningLow } from "@admin/components/overview/RunningLow";
import { SectionCard } from "@admin/components/overview/SectionCard";
import {
	TrendChip,
	trendDirection,
} from "@admin/components/overview/TrendChip";
import {
	daysOfStockLeft,
	formatPercentChange,
	parseOverviewRange,
	percentChange,
} from "@admin/lib/overview";
import { formatMoney } from "@repo/commerce";
import { DISPATCH_WINDOW_HOURS, getStoreOverview } from "@repo/database";
import { Button } from "@repo/ui/components/button";
import {
	ClockIcon,
	CreditCardIcon,
	PenLineIcon,
	PlusIcon,
	ShoppingBagIcon,
	TriangleAlertIcon,
} from "lucide-react";
import Link from "next/link";

function paymentSuccessRate(analytics: {
	attemptedPaymentCount: number;
	succeededPaymentCount: number;
}) {
	return analytics.attemptedPaymentCount
		? analytics.succeededPaymentCount / analytics.attemptedPaymentCount
		: null;
}

export default async function AdminOverviewPage({
	searchParams,
}: {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
	const params = await searchParams;
	const range = parseOverviewRange(params.range);
	const overview = await getStoreOverview({ days: range });
	const { analytics, previous, metrics, queues, generatedAt } = overview;

	const revenueChange = percentChange(
		analytics.revenueInPesewas,
		previous.revenueInPesewas,
	);
	const ordersChange = percentChange(
		analytics.orderCount,
		previous.orderCount,
	);
	const aovChange = percentChange(
		analytics.averageOrderValueInPesewas,
		previous.averageOrderValueInPesewas,
	);
	const successRate = paymentSuccessRate(analytics);
	const previousSuccessRate = paymentSuccessRate(previous);
	const successChange =
		successRate !== null && previousSuccessRate !== null
			? percentChange(successRate, previousSuccessRate)
			: null;

	const bestDay = analytics.daily.reduce(
		(best, day) =>
			day.revenueInPesewas > best.revenueInPesewas ? day : best,
		analytics.daily[0],
	);
	const chartData = analytics.daily.map((day, index) => ({
		date: day.date,
		current: day.revenueInPesewas,
		previous: previous.daily[index]?.revenueInPesewas ?? 0,
	}));

	const sellingOutThisWeek = overview.lowStock.filter((product) => {
		const daysLeft = daysOfStockLeft(
			product.stockQuantity,
			product.unitsPerDay,
		);
		return daysLeft !== null && daysLeft <= 7;
	}).length;

	const attention: AttentionItem[] = [
		{
			key: "past-window",
			title: "Past dispatch window",
			description: `Waiting more than ${DISPATCH_WINDOW_HOURS} hours`,
			count: queues.pastDispatchWindow,
			href: "/admin/orders",
			tone: "danger",
			icon: <ClockIcon />,
		},
		{
			key: "fulfil",
			title: "Orders to fulfil",
			description: "Paid and awaiting dispatch",
			count: queues.awaitingDispatch,
			href: "/admin/orders",
			tone: "info",
			icon: <ShoppingBagIcon />,
		},
		{
			key: "low-stock",
			title: "Low on stock",
			description: sellingOutThisWeek
				? `${sellingOutThisWeek} ${sellingOutThisWeek === 1 ? "sells" : "sell"} out this week`
				: "At or below restock threshold",
			count: metrics.lowStockProducts.length,
			href: "/admin/products",
			tone: "warning",
			icon: <TriangleAlertIcon />,
		},
		{
			key: "failed-payments",
			title: "Failed payments",
			description: "Last 7 days · retry or cancel",
			count: queues.failedPayments,
			href: "/admin/transactions",
			tone: "danger",
			icon: <CreditCardIcon />,
		},
		{
			key: "drafts",
			title: "Draft products",
			description: "Not published to the catalogue",
			count: queues.draftProducts,
			href: "/admin/products",
			tone: "neutral",
			icon: <PenLineIcon />,
		},
	];

	return (
		<div className="space-y-4">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
				<div>
					<h1 className="font-semibold text-2xl tracking-tight">
						Overview
					</h1>
					<p className="mt-1 text-muted-foreground text-sm">
						{new Intl.DateTimeFormat("en-GH", {
							weekday: "long",
							day: "numeric",
							month: "long",
						}).format(generatedAt)}{" "}
						· revenue excludes cancelled and refunded orders
					</p>
				</div>
				<div className="flex items-center gap-2">
					<Button asChild variant="secondary">
						<Link href="/admin/analytics">Analytics</Link>
					</Button>
					<Button asChild>
						<Link href="/admin/products/new">
							<PlusIcon className="size-4" /> Add product
						</Link>
					</Button>
				</div>
			</div>

			{/* Hero: the one number, with its trend beside it */}
			<SectionCard className="grid overflow-hidden lg:grid-cols-[300px_1fr]">
				<div className="border-b p-5 lg:border-r lg:border-b-0">
					<p className="font-medium text-muted-foreground text-[13px]">
						Paid revenue · last {range} days
					</p>
					<p className="mt-2 font-semibold text-4xl tracking-tighter tabular-nums">
						{formatMoney(analytics.revenueInPesewas)}
					</p>
					<div className="mt-3 flex flex-wrap items-center gap-2">
						<TrendChip direction={trendDirection(revenueChange)}>
							{formatPercentChange(revenueChange)}
						</TrendChip>
						<span className="text-muted-foreground/80 text-xs tabular-nums">
							{previous.revenueInPesewas
								? `from ${formatMoney(previous.revenueInPesewas)}`
								: "no previous period to compare"}
						</span>
					</div>
					<dl className="mt-5 grid grid-cols-2 gap-4 border-t pt-4">
						<div>
							<dt className="text-muted-foreground text-xs">
								Paid orders
							</dt>
							<dd className="mt-0.5 font-semibold tabular-nums">
								{analytics.paidOrderCount.toLocaleString()}
							</dd>
						</div>
						<div>
							<dt className="text-muted-foreground text-xs">
								Best day
							</dt>
							<dd className="mt-0.5 font-semibold tabular-nums">
								{formatMoney(bestDay?.revenueInPesewas ?? 0)}
							</dd>
						</div>
					</dl>
				</div>
				<div className="min-w-0 px-3 pt-3 pb-2 sm:px-4">
					<div className="flex items-center justify-between gap-3 px-1 pb-1">
						<p className="text-muted-foreground text-xs">
							Daily · compared to the previous {range} days
						</p>
						<RangeToggle active={range} />
					</div>
					<RevenueChart data={chartData} />
				</div>
			</SectionCard>

			{/* Secondary figures */}
			<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
				<MetricTile
					label="Orders"
					value={analytics.orderCount.toLocaleString()}
					trend={
						<TrendChip direction={trendDirection(ordersChange)}>
							{formatPercentChange(ordersChange)}
						</TrendChip>
					}
					detail={`${analytics.paidOrderCount.toLocaleString()} paid`}
				/>
				<MetricTile
					label="Average order value"
					value={formatMoney(analytics.averageOrderValueInPesewas)}
					trend={
						<TrendChip direction={trendDirection(aovChange)}>
							{formatPercentChange(aovChange)}
						</TrendChip>
					}
					detail="paid orders"
				/>
				<MetricTile
					label="Payment success"
					value={
						successRate === null
							? "—"
							: `${Math.round(successRate * 100)}%`
					}
					trend={
						<TrendChip direction={trendDirection(successChange)}>
							{formatPercentChange(successChange)}
						</TrendChip>
					}
					detail={
						analytics.attemptedPaymentCount
							? `${analytics.succeededPaymentCount} of ${analytics.attemptedPaymentCount} online`
							: "no online payments yet"
					}
				/>
				<MetricTile
					label="Customers"
					value={metrics.customers.toLocaleString()}
					trend={
						<TrendChip
							direction={queues.newCustomers > 0 ? "up" : "flat"}
						>
							+{queues.newCustomers}
						</TrendChip>
					}
					detail="new in 30 days"
				/>
			</div>

			<div className="grid items-start gap-4 lg:grid-cols-3">
				<AttentionQueue items={attention} />
				<BestSellers products={overview.topProducts} days={range} />
				<RunningLow
					products={overview.lowStock}
					activeProducts={metrics.activeProducts}
					totalProducts={metrics.products}
				/>
			</div>

			<RecentOrdersTable
				orders={overview.recentOrders}
				totalOrders={metrics.orders}
				now={generatedAt}
			/>
		</div>
	);
}
