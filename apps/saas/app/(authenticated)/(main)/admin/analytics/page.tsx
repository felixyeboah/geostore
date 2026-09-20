import { AdminHeader } from "@admin/components/AdminPage";
import { AnalyticsRange } from "@admin/components/analytics/AnalyticsRange";
import { RevenueChart } from "@admin/components/analytics/RevenueChart";
import { loadAnalyticsParams } from "@admin/lib/list-params";
import { formatMoney } from "@repo/commerce";
import { getStoreSalesAnalytics } from "@repo/database";
import { cn } from "@repo/ui";
import type { Metadata } from "next";
import type { SearchParams } from "nuqs/server";

export const metadata: Metadata = { title: "Analytics" };

/**
 * Payment success is a property of payment *attempts*, not of every order:
 * counting cash-on-delivery and still-pending checkouts in the denominator
 * made a perfectly healthy store look like it was declining half its cards.
 */
function successRate(succeeded: number, attempted: number): number | null {
	return attempted > 0 ? Math.round((succeeded / attempted) * 100) : null;
}

/**
 * Change against the previous period.
 *
 * A percentage measured against a near-empty period is noise — the first real
 * week of trading reads as "+9500%", which says nothing useful. So a period
 * that had nothing to compare against reports "new" instead, and two empty
 * periods report nothing at all.
 */
function change(current: number, previous: number): number | "new" | null {
	if (previous === 0) {
		return current === 0 ? null : "new";
	}
	return Math.round(((current - previous) / previous) * 100);
}

export default async function AdminAnalyticsPage({
	searchParams,
}: {
	searchParams: Promise<SearchParams>;
}) {
	const { days } = await loadAnalyticsParams(searchParams);

	// The period before this one, on the same length, is what makes every
	// figure here answer "compared with what?".
	const [current, previous] = await Promise.all([
		getStoreSalesAnalytics(days),
		getStoreSalesAnalytics(days, 1),
	]);

	const rate = successRate(
		current.succeededPaymentCount,
		current.attemptedPaymentCount,
	);
	const previousRate = successRate(
		previous.succeededPaymentCount,
		previous.attemptedPaymentCount,
	);

	const headline = [
		{
			key: "revenue",
			label: "Revenue",
			value: formatMoney(current.revenueInPesewas),
			change: change(current.revenueInPesewas, previous.revenueInPesewas),
			detail: `${current.paidOrderCount} paid ${current.paidOrderCount === 1 ? "order" : "orders"}`,
		},
		{
			key: "orders",
			label: "Orders placed",
			value: String(current.orderCount),
			change: change(current.orderCount, previous.orderCount),
			detail: `${current.orderCount - current.paidOrderCount} not paid`,
		},
		{
			key: "aov",
			label: "Average order",
			value: formatMoney(current.averageOrderValueInPesewas),
			change: change(
				current.averageOrderValueInPesewas,
				previous.averageOrderValueInPesewas,
			),
			detail: "Across paid orders",
		},
		{
			key: "payments",
			label: "Payment success",
			value: rate === null ? "—" : `${rate}%`,
			change:
				rate === null || previousRate === null
					? null
					: rate - previousRate,
			detail:
				current.attemptedPaymentCount > 0
					? `${current.succeededPaymentCount} of ${current.attemptedPaymentCount} online payments`
					: "No online payments yet",
		},
	];

	const hasSales = current.orderCount > 0 || previous.orderCount > 0;
	const productPeak = Math.max(
		...current.topProducts.map((product) => product.revenueInPesewas),
		1,
	);
	const statusTotal = current.statusBreakdown.reduce(
		(total, item) => total + item.count,
		0,
	);

	return (
		<div>
			<AdminHeader
				eyebrow="Performance"
				title="Store analytics"
				description={
					hasSales
						? `Paid sales, order value and product demand over the last ${days} days, against the ${days} before them.`
						: "Sales, order value and product demand appear here once the first order is placed."
				}
				actions={<AnalyticsRange />}
			/>

			<section className="mt-9 grid gap-x-10 gap-y-7 border-border border-b pb-7 sm:grid-cols-2 lg:grid-cols-4">
				{headline.map((metric) => (
					<div key={metric.key}>
						<p className="eyebrow text-muted-foreground">
							{metric.label}
						</p>
						<p className="mt-3 font-semibold text-[26px] text-foreground tabular-nums tracking-[-0.03em]">
							{metric.value}
						</p>
						<p className="mt-1.5 flex flex-wrap items-baseline gap-x-2 text-[12px]">
							{metric.change === "new" ? (
								<span className="text-foreground">new</span>
							) : metric.change !== null ? (
								<span
									className={cn(
										"tabular-nums",
										metric.change > 0
											? "text-foreground"
											: metric.change < 0
												? "text-[var(--ed-accent)]"
												: "text-muted-foreground",
									)}
								>
									{metric.change > 0 ? "+" : ""}
									{metric.change}
									{metric.key === "payments" ? " pts" : "%"}
								</span>
							) : null}
							<span className="text-muted-foreground">
								{metric.detail}
							</span>
						</p>
					</div>
				))}
			</section>

			{hasSales ? (
				<>
					<div className="mt-9">
						<RevenueChart days={current.daily} />
					</div>

					<div className="mt-10 grid items-start gap-x-12 gap-y-10 lg:grid-cols-2">
						<section className="border-border border-t pt-7">
							<div className="flex items-baseline justify-between gap-4">
								<h2 className="eyebrow text-muted-foreground">
									Top products
								</h2>
								<p className="text-[12px] text-muted-foreground">
									By revenue
								</p>
							</div>
							{current.topProducts.length === 0 ? (
								<p className="mt-6 text-[13.5px] text-muted-foreground">
									Product demand appears after the first paid
									order.
								</p>
							) : (
								<ol className="mt-5 border-border border-t">
									{current.topProducts.map(
										(product, index) => (
											<li
												key={product.productId}
												className="border-border border-b py-3.5"
											>
												<div className="flex items-baseline gap-3">
													<span className="w-5 shrink-0 font-mono text-[11px] text-muted-foreground tabular-nums">
														{index + 1}
													</span>
													<span className="min-w-0 flex-1 truncate font-medium text-[13.5px] text-foreground">
														{product.name}
													</span>
													<span className="shrink-0 font-medium text-[13.5px] text-foreground tabular-nums">
														{formatMoney(
															product.revenueInPesewas,
														)}
													</span>
												</div>
												<div className="mt-2 flex items-center gap-3 pl-8">
													<span
														aria-hidden="true"
														className="h-px bg-foreground"
														style={{
															width: `${Math.max((product.revenueInPesewas / productPeak) * 100, 2)}%`,
														}}
													/>
													<span className="shrink-0 text-[11.5px] text-muted-foreground tabular-nums">
														{product.quantity} sold
													</span>
												</div>
											</li>
										),
									)}
								</ol>
							)}
						</section>

						<section className="border-border border-t pt-7">
							<div className="flex items-baseline justify-between gap-4">
								<h2 className="eyebrow text-muted-foreground">
									Fulfilment mix
								</h2>
								<p className="text-[12px] text-muted-foreground">
									All orders, all time
								</p>
							</div>
							{current.statusBreakdown.length === 0 ? (
								<p className="mt-6 text-[13.5px] text-muted-foreground">
									No fulfilment data yet.
								</p>
							) : (
								<ul className="mt-5 border-border border-t">
									{current.statusBreakdown.map((item) => (
										<li
											key={item.status}
											className="flex items-center gap-4 border-border border-b py-3.5"
										>
											<span className="min-w-0 flex-1 text-[13.5px] text-foreground capitalize">
												{item.status
													.toLocaleLowerCase()
													.replaceAll("_", " ")}
											</span>
											{/* A track, so short bars are still
											    comparable rather than specks. */}
											<span
												aria-hidden="true"
												className="h-1 w-24 shrink-0 bg-muted"
											>
												<span
													className="block h-full bg-foreground"
													style={{
														width: `${Math.max((item.count / Math.max(statusTotal, 1)) * 100, 4)}%`,
													}}
												/>
											</span>
											<span className="w-10 shrink-0 text-right font-medium text-[13.5px] text-foreground tabular-nums">
												{item.count}
											</span>
										</li>
									))}
								</ul>
							)}
						</section>
					</div>
				</>
			) : (
				<div className="mt-9 border-border border-t py-16 text-center">
					<p className="font-medium text-[15px] text-foreground">
						Nothing to measure yet
					</p>
					<p className="mx-auto mt-2 max-w-sm text-[13.5px] text-muted-foreground">
						Revenue, order value and product demand are all drawn
						from paid orders. The first one through checkout fills
						this page.
					</p>
				</div>
			)}
		</div>
	);
}
