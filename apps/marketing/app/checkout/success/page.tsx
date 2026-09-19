import { getSession } from "@auth/lib/server";
import {
	CheckoutSuccess,
	toCheckoutSuccessOrder,
} from "@commerce/components/CheckoutSuccess";
import { canReadStoreOrder } from "@commerce/lib/order-access";
import { getStoreOrderByNumber } from "@repo/database";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Order confirmed",
	description: "Your Geostoresgh order has been placed.",
};

interface CheckoutSuccessPageProps {
	searchParams: Promise<{ order?: string; t?: string }>;
}

export default async function CheckoutSuccessPage({
	searchParams,
}: CheckoutSuccessPageProps) {
	const session = await getSession();
	const { order: orderNumber, t: accessToken } = await searchParams;
	const order = orderNumber ? await getStoreOrderByNumber(orderNumber) : null;
	const isAllowed =
		order !== null &&
		canReadStoreOrder({
			orderId: order.id,
			orderUserId: order.userId ?? null,
			sessionUserId: session?.user.id,
			sessionUserRole: session?.user.role,
			token: accessToken,
		});

	return (
		<CheckoutSuccess
			order={isAllowed && order ? toCheckoutSuccessOrder(order) : null}
		/>
	);
}
