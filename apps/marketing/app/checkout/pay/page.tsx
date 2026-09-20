import { getSession } from "@auth/lib/server";
import { CheckoutPayStatus } from "@commerce/components/CheckoutPayStatus";
import { canReadStoreOrder } from "@commerce/lib/order-access";
import { formatMoney } from "@repo/commerce";
import { getStoreOrderById } from "@repo/database";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
	title: "Complete payment",
	description: "Finish your Geostoresgh mobile money or card payment.",
};

interface CheckoutPayPageProps {
	searchParams: Promise<{ order?: string; payment?: string; t?: string }>;
}

export default async function CheckoutPayPage({
	searchParams,
}: CheckoutPayPageProps) {
	const params = await searchParams;
	if (!params.order) {
		notFound();
	}

	const order = await getStoreOrderById(params.order);
	if (!order) {
		notFound();
	}

	const session = await getSession();
	const isAllowed = canReadStoreOrder({
		orderId: order.id,
		orderUserId: order.userId ?? null,
		sessionUserId: session?.user.id,
		sessionUserRole: session?.user.role,
		token: params.t,
	});

	if (!isAllowed) {
		notFound();
	}

	return (
		<CheckoutPayStatus
			orderId={order.id}
			orderNumber={order.orderNumber}
			accessToken={params.t ?? ""}
			totalLabel={formatMoney(order.totalInPesewas)}
			paymentMethod={order.paymentMethod}
			initialPaymentStatus={order.paymentStatus}
			paymentId={params.payment}
		/>
	);
}
