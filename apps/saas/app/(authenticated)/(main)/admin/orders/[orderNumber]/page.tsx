import { AdminHeader, AdminSection } from "@admin/components/AdminPage";
import {
	formatOrderTime,
	OrderBadges,
	OrderCustomerSection,
	OrderDeliverySection,
	OrderDetailActions,
	OrderItemsSection,
	OrderPaymentSection,
	OrderTimelineSection,
	paymentMethodLabel,
} from "@admin/components/orders/OrderDetail";
import { toAdminOrderDetail } from "@admin/lib/order-detail";
import { formatMoney } from "@repo/commerce";
import { getAdminStoreOrderByNumber } from "@repo/database";
import { ArrowLeftIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

export const metadata: Metadata = { title: "Order" };

/**
 * The whole order on its own URL — the same detail the table's sheet shows,
 * with room for it to breathe. The sheet links here when the job needs more
 * than a panel.
 */
export default async function AdminOrderPage({
	params,
}: {
	params: Promise<{ orderNumber: string }>;
}) {
	const { orderNumber } = await params;
	const record = await getAdminStoreOrderByNumber(orderNumber);
	if (!record) {
		notFound();
	}
	const order = toAdminOrderDetail(record);

	return (
		<div className="pt-10 pb-16">
			<Link
				href="/admin/orders"
				className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
			>
				<ArrowLeftIcon className="size-3.5" />
				Orders
			</Link>

			<div className="mt-6">
				<AdminHeader
					eyebrow="Order"
					title={
						<span className="font-mono tracking-tight">
							{order.orderNumber}
						</span>
					}
					description={`Placed ${formatOrderTime(order.placedAt)} — ${paymentMethodLabel(order.paymentMethod)}, ${formatMoney(order.totalInPesewas)}.`}
					actions={<OrderBadges order={order} />}
				/>
			</div>

			<div className="mt-10 grid items-start gap-x-16 gap-y-10 lg:grid-cols-[minmax(0,1fr)_340px]">
				<div className="space-y-9">
					<OrderItemsSection order={order} />
					<OrderPaymentSection order={order} />
					<OrderTimelineSection order={order} />
				</div>

				<aside className="space-y-8 lg:sticky lg:top-6">
					<AdminSection
						title="Fulfilment"
						description="Move the order along, or mark the money received."
					>
						<div className="border-border border-t pt-5">
							<OrderDetailActions order={order} />
						</div>
					</AdminSection>
					<div className="space-y-7">
						<OrderCustomerSection order={order} />
						<OrderDeliverySection order={order} />
					</div>
				</aside>
			</div>
		</div>
	);
}
