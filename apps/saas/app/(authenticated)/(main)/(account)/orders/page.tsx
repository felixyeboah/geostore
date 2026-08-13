import { getSession } from "@auth/lib/server";
import { OrderHistory } from "@commerce/components/OrderHistory";
import { getCustomerOrderHistory } from "@commerce/lib/customer-orders";
import { PageHeader } from "@shared/components/PageHeader";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Your orders" };

export default async function OrdersPage() {
	const session = await getSession();
	const orders = session
		? await getCustomerOrderHistory(session.user.id)
		: [];

	return (
		<div>
			<PageHeader
				title="Your orders"
				subtitle="Track purchases, review delivered items, and keep your order details together."
			/>
			<OrderHistory initialOrders={orders} />
		</div>
	);
}
