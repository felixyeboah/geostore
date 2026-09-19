import { formatMoney } from "@repo/commerce";
import { getStoreSalesAnalytics } from "@repo/database";
import { Card } from "@repo/ui";
import { BarChart3Icon, CircleDollarSignIcon, ReceiptIcon } from "lucide-react";

export default async function AdminAnalyticsPage() {
	const analytics = await getStoreSalesAnalytics(30);
	const maxRevenue = Math.max(
		...analytics.daily.map((day) => day.revenueInPesewas),
		1,
	);
	const maxProductRevenue = Math.max(
		...analytics.topProducts.map((product) => product.revenueInPesewas),
		1,
	);
	// Payment success is a property of payment *attempts*, not of every order:
	// counting cash-on-delivery and still-pending checkouts in the denominator
	// made a perfectly healthy store look like it was declining half its cards.
	const paymentSuccessRate = analytics.attemptedPaymentCount
		? Math.round(
				(analytics.succeededPaymentCount /
					analytics.attemptedPaymentCount) *
					100,
			)
		: 0;

	return (
		<div className="space-y-8">
			<section>
				<p className="font-semibold text-primary text-sm">
					Performance
				</p>
				<h1 className="mt-1 font-semibold text-2xl">Store analytics</h1>
				<p className="mt-1 text-muted-foreground text-sm">
					A 30-day view of paid sales, order value, fulfilment, and
					product demand.
				</p>
				<div className="mt-6 grid gap-4 sm:grid-cols-3">
					{[
						{
							label: "30-day revenue",
							value: formatMoney(analytics.revenueInPesewas),
							detail: `${analytics.paidOrderCount} paid orders`,
							icon: CircleDollarSignIcon,
						},
						{
							label: "Average order value",
							value: formatMoney(
								analytics.averageOrderValueInPesewas,
							),
							detail: "Across paid orders",
							icon: ReceiptIcon,
						},
						{
							label: "Payment success",
							value: analytics.attemptedPaymentCount
								? `${paymentSuccessRate}%`
								: "—",
							detail: analytics.attemptedPaymentCount
								? `${analytics.succeededPaymentCount} of ${analytics.attemptedPaymentCount} online payments`
								: "No online payments yet",
							icon: BarChart3Icon,
						},
					].map((metric) => (
						<Card key={metric.label} className="p-5">
							<div className="flex items-center justify-between">
								<p className="text-muted-foreground text-sm">
									{metric.label}
								</p>
								<metric.icon className="size-4 text-primary" />
							</div>
							<p className="mt-5 font-semibold text-3xl tracking-tight tabular-nums">
								{metric.value}
							</p>
							<p className="mt-1 text-muted-foreground text-xs">
								{metric.detail}
							</p>
						</Card>
					))}
				</div>
			</section>

			<section className="border-border border-t pt-7 sm:p-6">
				<div className="flex items-end justify-between gap-4">
					<div>
						<h2 className="font-semibold">Daily paid revenue</h2>
						<p className="mt-1 text-muted-foreground text-xs">
							Last 30 calendar days
						</p>
					</div>
					<p className="font-semibold tabular-nums">
						{formatMoney(analytics.revenueInPesewas)}
					</p>
				</div>
				<div
					className="mt-8 flex h-56 items-end gap-1"
					role="img"
					aria-label="Daily revenue chart"
				>
					{analytics.daily.map((day, index) => {
						const height = Math.max(
							(day.revenueInPesewas / maxRevenue) * 100,
							day.orders > 0 ? 3 : 1,
						);
						return (
							<div
								key={day.date}
								className="group relative flex h-full min-w-0 flex-1 items-end"
							>
								<div
									className="w-full rounded-t-sm bg-primary/75 transition group-hover:bg-primary"
									style={{ height: `${height}%` }}
								/>
								<span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-background text-xs group-hover:block">
									{day.date}:{" "}
									{formatMoney(day.revenueInPesewas)} ·{" "}
									{day.orders} orders
								</span>
								{(index === 0 ||
									index === analytics.daily.length - 1) && (
									<span className="absolute top-full mt-2 text-muted-foreground text-[10px]">
										{new Intl.DateTimeFormat("en-GH", {
											month: "short",
											day: "numeric",
										}).format(new Date(day.date))}
									</span>
								)}
							</div>
						);
					})}
				</div>
			</section>

			<div className="grid items-start gap-6 lg:grid-cols-2">
				<section className="rounded-2xl border bg-card">
					<header className="border-b p-5">
						<h2 className="font-semibold">Top products</h2>
						<p className="mt-1 text-muted-foreground text-xs">
							Ranked by 30-day paid revenue
						</p>
					</header>
					{analytics.topProducts.length === 0 ? (
						<p className="p-5 text-muted-foreground text-sm">
							Product performance appears after the first paid
							order.
						</p>
					) : (
						<div className="divide-y">
							{analytics.topProducts.map((product) => (
								<div key={product.productId} className="p-5">
									<div className="flex justify-between gap-4 text-sm">
										<span className="font-medium">
											{product.name}
										</span>
										<span className="font-semibold tabular-nums">
											{formatMoney(
												product.revenueInPesewas,
											)}
										</span>
									</div>
									<div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
										<div
											className="h-full rounded-full bg-primary"
											style={{
												width: `${(product.revenueInPesewas / maxProductRevenue) * 100}%`,
											}}
										/>
									</div>
									<p className="mt-2 text-muted-foreground text-xs">
										{product.quantity} units sold
									</p>
								</div>
							))}
						</div>
					)}
				</section>

				<section className="rounded-2xl border bg-card">
					<header className="border-b p-5">
						<h2 className="font-semibold">Fulfilment mix</h2>
						<p className="mt-1 text-muted-foreground text-xs">
							Current status across all orders
						</p>
					</header>
					{analytics.statusBreakdown.length === 0 ? (
						<p className="p-5 text-muted-foreground text-sm">
							No fulfilment data yet.
						</p>
					) : (
						<div className="divide-y">
							{analytics.statusBreakdown.map((item) => (
								<div
									key={item.status}
									className="flex items-center justify-between gap-4 p-5"
								>
									<span className="text-sm capitalize">
										{item.status
											.toLocaleLowerCase()
											.replaceAll("_", " ")}
									</span>
									<span className="font-semibold tabular-nums">
										{item.count}
									</span>
								</div>
							))}
						</div>
					)}
				</section>
			</div>
		</div>
	);
}
