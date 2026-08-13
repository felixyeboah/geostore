import { getStoreOrdersByUserId } from "@repo/database";
import type { MockOrder } from "./order";

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
		case "PROCESSING":
			return "processing";
		case "OUT_FOR_DELIVERY":
			return "out-for-delivery";
		case "DELIVERED":
			return "delivered";
		case "CANCELLED":
		case "REFUNDED":
			return "cancelled";
		default:
			return "confirmed";
	}
}

export async function getCustomerOrderHistory(
	userId: string,
): Promise<MockOrder[]> {
	const orders = await getStoreOrdersByUserId(userId);
	return orders.map((order) => ({
		id: order.orderNumber,
		status: mapStatus(order.status),
		paymentStatus: "paid",
		paymentMethod: "mock",
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
