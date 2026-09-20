import { getSession } from "@auth/lib/server";
import {
	CheckoutSuccess,
	toCheckoutSuccessOrder,
} from "@commerce/components/CheckoutSuccess";
import { canReadStoreOrder } from "@commerce/lib/order-access";
import { formatMoney, whatsAppLink } from "@repo/commerce";
import { getStoreOrderByNumber } from "@repo/database";
import { getStorefrontCheckout } from "@shared/lib/store-settings";
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

	// WhatsApp orders end by handing the customer to the shop's chat, with the
	// order spelled out so nobody has to retype a number or a total.
	let whatsappHref: string | null = null;
	if (isAllowed && order && order.paymentMethod === "WHATSAPP") {
		const checkout = await getStorefrontCheckout();
		const lines = order.items.map(
			(item) =>
				`${item.quantity}× ${item.productName}${item.variantName ? ` (${item.variantName})` : ""}`,
		);
		whatsappHref = whatsAppLink(
			checkout.whatsappNumber,
			[
				`Hi GeoStoresGH — I've just placed order ${order.orderNumber}:`,
				...lines,
				`Total: ${formatMoney(order.totalInPesewas)}`,
			].join("\n"),
		);
	}

	return (
		<CheckoutSuccess
			order={isAllowed && order ? toCheckoutSuccessOrder(order) : null}
			whatsappHref={whatsappHref}
		/>
	);
}
