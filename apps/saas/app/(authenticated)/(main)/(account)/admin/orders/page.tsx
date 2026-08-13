import { OrderStatusSelect } from "@admin/components/orders/OrderStatusSelect";
import { formatMoney } from "@commerce/lib/money";
import { getAdminStoreOrders } from "@repo/database";
import { Badge } from "@repo/ui/components/badge";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@repo/ui/components/table";
import { ShoppingBagIcon } from "lucide-react";

function getAddressLabel(value: unknown): string {
	if (!value || typeof value !== "object" || Array.isArray(value)) {
		return "Address unavailable";
	}
	const address = value as Record<string, unknown>;
	return (
		[address.city, address.region]
			.filter((part): part is string => typeof part === "string")
			.join(", ") || "Address unavailable"
	);
}

export default async function AdminOrdersPage() {
	const orders = await getAdminStoreOrders();

	return (
		<div>
			<div>
				<p className="font-semibold text-primary text-sm">Fulfilment</p>
				<h1 className="mt-1 font-semibold text-2xl">Orders</h1>
				<p className="mt-1 text-muted-foreground text-sm">
					Review customer details, payment state, and move orders
					through delivery.
				</p>
			</div>
			{orders.length === 0 ? (
				<div className="mt-6 flex min-h-72 flex-col items-center justify-center rounded-2xl bg-muted/55 p-6 text-center">
					<ShoppingBagIcon className="size-7 text-muted-foreground" />
					<h2 className="mt-4 font-semibold text-xl">
						No orders yet
					</h2>
					<p className="mt-2 text-muted-foreground text-sm">
						Orders placed through checkout will appear here.
					</p>
				</div>
			) : (
				<div className="mt-6 overflow-hidden rounded-2xl border bg-card">
					<div className="overflow-x-auto">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Order</TableHead>
									<TableHead>Customer</TableHead>
									<TableHead>Delivery</TableHead>
									<TableHead>Payment</TableHead>
									<TableHead>Total</TableHead>
									<TableHead className="text-right">
										Fulfilment status
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{orders.map((order) => (
									<TableRow key={order.id}>
										<TableCell>
											<p className="font-medium text-sm tabular-nums">
												{order.orderNumber}
											</p>
											<p className="mt-1 text-muted-foreground text-xs">
												{new Intl.DateTimeFormat(
													"en-GH",
													{
														dateStyle: "medium",
														timeStyle: "short",
													},
												).format(order.placedAt)}{" "}
												· {order.items.length}{" "}
												{order.items.length === 1
													? "item"
													: "items"}
											</p>
										</TableCell>
										<TableCell>
											<p className="font-medium text-sm">
												{order.user?.name ??
													order.customerEmail.split(
														"@",
													)[0]}
											</p>
											<p className="mt-1 text-muted-foreground text-xs">
												{order.customerEmail}
												<br />
												{order.customerPhone}
											</p>
										</TableCell>
										<TableCell className="text-sm">
											{getAddressLabel(
												order.shippingAddress,
											)}
										</TableCell>
										<TableCell>
											<Badge
												status={
													order.paymentStatus ===
													"PAID"
														? "success"
														: "warning"
												}
											>
												{order.paymentStatus.toLocaleLowerCase()}
											</Badge>
											<p className="mt-1 text-muted-foreground text-xs">
												{order.paymentMethod.toLocaleLowerCase()}
											</p>
										</TableCell>
										<TableCell className="font-semibold tabular-nums">
											{formatMoney(order.totalInPesewas)}
										</TableCell>
										<TableCell className="text-right">
											<OrderStatusSelect
												orderId={order.id}
												status={order.status}
											/>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>
				</div>
			)}
		</div>
	);
}
