import type { MockOrder } from "@repo/commerce";
import { getStoreOrdersByUserId } from "@repo/database";

function parseAddress(value: unknown): MockOrder["address"] {
	if (!value || typeof value !== "object" || Array.isArray(value)) {
		return { line1: "Address unavailable", city: "", region: "" };
	}
	const address = value as Record<string, unknown>;
	return {
		line1:
			typeof address.line1 === "string"
				? address.line1
				: "Address unavailable",
		line2: typeof address.line2 === "string" ? address.line2 : undefined,
		city: typeof address.city === "string" ? address.city : "",
		region: typeof address.region === "string" ? address.region : "",
	};
}

function mapStatus(status: string): MockOrder["status"] {
	switch (status) {
		// An order still waiting on a payment prompt is NOT confirmed. It used
		// to fall through to "confirmed" here, so a customer who abandoned a
		// mobile-money prompt saw a green "Confirmed" badge for an order they
		// had never paid for.
		case "PENDING":
			return "pending";
		case "PROCESSING":
		case "READY_FOR_DELIVERY":
			return "processing";
		case "OUT_FOR_DELIVERY":
			return "out-for-delivery";
		case "DELIVERED":
			return "delivered";
		case "CANCELLED":
			return "cancelled";
		case "REFUNDED":
			return "refunded";
		default:
			return "confirmed";
	}
}

function mapPaymentStatus(status: string): MockOrder["paymentStatus"] {
	switch (status) {
		case "PAID":
			return "paid";
		case "FAILED":
			return "failed";
		case "REFUNDED":
			return "refunded";
		default:
			return "pending";
	}
}

export async function getCustomerOrderHistory(
	userId: string,
): Promise<MockOrder[]> {
	const orders = await getStoreOrdersByUserId(userId);
	return orders.map((order) => ({
		id: order.orderNumber,
		status: mapStatus(order.status),
		paymentStatus: mapPaymentStatus(order.paymentStatus),
		paymentMethod: order.paymentMethod,
		placedAt: order.placedAt.toISOString(),
		customer: {
			name: "Customer",
			email: order.customerEmail,
			phone: order.customerPhone,
		},
		address: parseAddress(order.shippingAddress),
		items: order.items.map((item) => ({
			productId: item.productId,
			orderItemId: item.id,
			name: item.productName,
			priceInPesewas: item.unitPriceInPesewas,
			quantity: item.quantity,
			stockQuantity: 0,
			lineTotalInPesewas: item.lineTotalInPesewas,
			hasReview: Boolean(item.review),
		})),
		itemCount: order.items.reduce(
			(total, item) => total + item.quantity,
			0,
		),
		subtotalInPesewas: order.subtotalInPesewas,
		deliveryInPesewas: order.deliveryInPesewas,
		totalInPesewas: order.totalInPesewas,
	}));
}
