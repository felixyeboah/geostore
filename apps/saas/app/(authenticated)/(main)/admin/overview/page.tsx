import { AdminHeader, AdminSection } from "@admin/components/AdminPage";
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
import {
	TrendChip,
	trendDirection,
} from "@admin/components/overview/TrendChip";
import { adminButtonClass } from "@admin/components/ui";
import {
	daysOfStockLeft,
	formatPercentChange,
	parseOverviewRange,
	percentChange,
} from "@admin/lib/overview";
import { formatMoney } from "@repo/commerce";
import { DISPATCH_WINDOW_HOURS, getStoreOverview } from "@repo/database";
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

	const dateLine = new Intl.DateTimeFormat("en-GH", {
		weekday: "long",
		day: "numeric",
		month: "long",
	}).format(generatedAt);

	return (
		<div>
			<AdminHeader
				eyebrow="Performance"
				title="Overview"
				description={`${dateLine} · revenue excludes cancelled and refunded orders.`}
				actions={
					<>
						<Link
							href="/admin/analytics"
							className={adminButtonClass("quiet")}
						>
							Analytics
						</Link>
						<Link
							href="/admin/products/new"
							className={adminButtonClass("primary")}
						>
							<PlusIcon className="size-4" />
							Add product
						</Link>
					</>
				}
			/>

			{/*
			 * One figure leads the page. Everything below is context for it,
			 * which is why nothing else is set at this size.
			 */}
			<section className="pt-10">
				<div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
					<div>
						<p className="eyebrow text-muted-foreground">
							Paid revenue · last {range} days
						</p>
						<p className="mt-4 font-semibold text-[clamp(38px,5vw,64px)] text-foreground leading-[0.95] tracking-[-0.045em] tabular-nums">
							{formatMoney(analytics.revenueInPesewas)}
						</p>
						<p className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
							<TrendChip
								direction={trendDirection(revenueChange)}
							>
								{formatPercentChange(revenueChange)}
							</TrendChip>
							<span className="text-[13px] text-muted-foreground tabular-nums">
								{previous.revenueInPesewas
									? `from ${formatMoney(previous.revenueInPesewas)} the previous ${range} days`
									: "no previous period to compare"}
							</span>
						</p>
					</div>
					<div className="flex flex-col items-start gap-4 sm:items-end">
						<RangeToggle active={range} />
						<p className="text-[12.5px] text-muted-foreground tabular-nums">
							Best day{" "}
							{formatMoney(bestDay?.revenueInPesewas ?? 0)}
							{" · "}
							{analytics.paidOrderCount.toLocaleString()} paid
							orders
						</p>
					</div>
				</div>

				<div className="mt-8">
					<RevenueChart data={chartData} />
				</div>
			</section>

			{/*
			 * The supporting figures as one strip of type. Hairlines between
			 * them rather than four boxes, so they read as a single row.
			 */}
			<section className="mt-12 grid gap-8 border-border border-t pt-8 sm:grid-cols-2 sm:gap-x-10 xl:grid-cols-4 xl:divide-x xl:divide-border">
				<div className="xl:pr-10">
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
				</div>
				<div className="xl:px-10">
					<MetricTile
						label="Average order"
						value={formatMoney(
							analytics.averageOrderValueInPesewas,
						)}
						trend={
							<TrendChip direction={trendDirection(aovChange)}>
								{formatPercentChange(aovChange)}
							</TrendChip>
						}
						detail="across paid orders"
					/>
				</div>
				<div className="xl:px-10">
					<MetricTile
						label="Payments taken"
						value={
							successRate === null
								? "—"
								: `${Math.round(successRate * 100)}%`
						}
						trend={
							<TrendChip
								direction={trendDirection(successChange)}
							>
								{formatPercentChange(successChange)}
							</TrendChip>
						}
						detail={
							analytics.attemptedPaymentCount
								? `${analytics.succeededPaymentCount} of ${analytics.attemptedPaymentCount} online`
								: "no online payments yet"
						}
					/>
				</div>
				<div className="xl:pl-10">
					<MetricTile
						label="Customers"
						value={metrics.customers.toLocaleString()}
						trend={
							<TrendChip
								direction={
									queues.newCustomers > 0 ? "up" : "flat"
								}
							>
								+{queues.newCustomers}
							</TrendChip>
						}
						detail="new in 30 days"
					/>
				</div>
			</section>

			<AdminSection className="mt-12">
				<div className="grid items-start gap-10 lg:grid-cols-3 lg:gap-12">
					<AttentionQueue items={attention} />
					<BestSellers products={overview.topProducts} days={range} />
					<RunningLow
						products={overview.lowStock}
						activeProducts={metrics.activeProducts}
						totalProducts={metrics.products}
					/>
				</div>
			</AdminSection>

			<AdminSection className="mt-12">
				<RecentOrdersTable
					orders={overview.recentOrders}
					totalOrders={metrics.orders}
					now={generatedAt}
				/>
			</AdminSection>
		</div>
	);
}
