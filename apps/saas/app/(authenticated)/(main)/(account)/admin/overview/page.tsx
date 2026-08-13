import { formatMoney } from "@commerce/lib/money";
import { getAdminStoreOrders, getStoreAdminMetrics } from "@repo/database";
import { Card } from "@repo/ui";
import {
	AlertTriangleIcon,
	ArrowRightIcon,
	PackageIcon,
	ReceiptTextIcon,
	ShoppingBagIcon,
	UsersIcon,
} from "lucide-react";
import Link from "next/link";

export default async function AdminOverviewPage() {
	const [metrics, orders] = await Promise.all([
		getStoreAdminMetrics(),
		getAdminStoreOrders(),
	]);
	const recentOrders = orders.slice(0, 5);

	return (
		<div className="space-y-8">
			<section>
				<div className="flex items-end justify-between gap-4">
					<div>
						<p className="font-semibold text-primary text-sm">
							Store pulse
						</p>
						<h1 className="mt-1 font-semibold text-2xl">
							What needs attention today
						</h1>
					</div>
					<Link
						href="/admin/products/new"
						className="font-semibold text-primary text-sm"
					>
						Add product
					</Link>
				</div>
				<div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
					{[
						{
							label: "Paid revenue",
							value: formatMoney(metrics.revenueInPesewas),
							detail: "Mock and completed payments",
							icon: ReceiptTextIcon,
						},
						{
							label: "Orders",
							value: metrics.orders.toLocaleString(),
							detail: "All fulfilment states",
							icon: ShoppingBagIcon,
						},
						{
							label: "Active products",
							value: `${metrics.activeProducts}/${metrics.products}`,
							detail: "Visible in the catalogue",
							icon: PackageIcon,
						},
						{
							label: "Customers",
							value: metrics.customers.toLocaleString(),
							detail: "Registered accounts",
							icon: UsersIcon,
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

			<div className="grid items-start gap-6 xl:grid-cols-[1.3fr_0.7fr]">
				<section className="rounded-2xl border bg-card">
					<header className="flex items-center justify-between gap-4 border-b p-5">
						<div>
							<h2 className="font-semibold">Recent orders</h2>
							<p className="mt-1 text-muted-foreground text-xs">
								Newest customer activity
							</p>
						</div>
						<Link
							href="/admin/orders"
							className="inline-flex items-center gap-1 font-semibold text-primary text-sm"
						>
							View all <ArrowRightIcon className="size-3.5" />
						</Link>
					</header>
					{recentOrders.length === 0 ? (
						<div className="flex min-h-52 flex-col items-center justify-center p-6 text-center">
							<ShoppingBagIcon className="size-6 text-muted-foreground" />
							<p className="mt-3 font-medium">No orders yet</p>
							<p className="mt-1 text-muted-foreground text-sm">
								Completed mock checkouts will appear here.
							</p>
						</div>
					) : (
						<div className="divide-y">
							{recentOrders.map((order) => (
								<Link
									key={order.id}
									href="/admin/orders"
									className="grid grid-cols-[1fr_auto] gap-4 p-5 transition hover:bg-muted/40"
								>
									<div>
										<p className="font-medium text-sm tabular-nums">
											{order.orderNumber}
										</p>
										<p className="mt-1 text-muted-foreground text-xs">
											{order.customerEmail} ·{" "}
											{order.items.length}{" "}
											{order.items.length === 1
												? "item"
												: "items"}
										</p>
									</div>
									<div className="text-right">
										<p className="font-semibold text-sm tabular-nums">
											{formatMoney(order.totalInPesewas)}
										</p>
										<p className="mt-1 text-muted-foreground text-xs">
											{order.status
												.toLocaleLowerCase()
												.replaceAll("_", " ")}
										</p>
									</div>
								</Link>
							))}
						</div>
					)}
				</section>

				<section className="rounded-2xl border bg-card">
					<header className="border-b p-5">
						<h2 className="font-semibold">Inventory watch</h2>
						<p className="mt-1 text-muted-foreground text-xs">
							Products at or below five units
						</p>
					</header>
					{metrics.lowStockProducts.length === 0 ? (
						<div className="p-5 text-muted-foreground text-sm">
							All active products have healthy stock.
						</div>
					) : (
						<div className="divide-y">
							{metrics.lowStockProducts.map((product) => (
								<Link
									key={product.id}
									href={`/admin/products/${product.id}`}
									className="flex items-center justify-between gap-4 p-5 transition hover:bg-muted/40"
								>
									<div className="flex items-center gap-3">
										<AlertTriangleIcon className="size-4 text-amber-600" />
										<span className="font-medium text-sm">
											{product.name}
										</span>
									</div>
									<span className="font-semibold text-amber-700 text-sm tabular-nums">
										{product.stockQuantity} left
									</span>
								</Link>
							))}
						</div>
					)}
				</section>
			</div>
		</div>
	);
}
