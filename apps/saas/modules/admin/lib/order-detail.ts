import type { getAdminStoreOrder } from "@repo/database";
import type { OrderStatusKey } from "./overview";

type AdminOrderRecord = NonNullable<
	Awaited<ReturnType<typeof getAdminStoreOrder>>
>;

export interface AdminOrderItem {
	id: string;
	productId: string;
	productName: string;
	variantName: string | null;
	sku: string;
	imageUrl: string | null;
	unitPriceInPesewas: number;
	quantity: number;
	lineTotalInPesewas: number;
}

export interface AdminOrderTransaction {
	id: string;
	reference: string;
	provider: string;
	paymentMethod: string;
	status: string;
	amountInPesewas: number;
	providerPaymentId: string | null;
	processedAt: string | null;
	createdAt: string;
}

export interface AdminOrderEvent {
	id: string;
	status: OrderStatusKey;
	note: string | null;
	createdAt: string;
}

export interface AdminOrderDetail {
	id: string;
	orderNumber: string;
	placedAt: string;
	status: OrderStatusKey;
	paymentStatus: string;
	paymentMethod: string;
	currency: string;
	customerName: string;
	customerEmail: string;
	customerPhone: string;
	/** Set when a registered account placed the order. */
	accountName: string | null;
	addressLines: string[];
	customerNote: string | null;
	items: AdminOrderItem[];
	subtotalInPesewas: number;
	deliveryInPesewas: number;
	discountInPesewas: number;
	totalInPesewas: number;
	transactions: AdminOrderTransaction[];
	events: AdminOrderEvent[];
	/** Cancelled or refunded — no more work to do on it. */
	isClosed: boolean;
}

function readAddress(shippingAddress: unknown): {
	recipient: string | null;
	lines: string[];
} {
	if (
		!shippingAddress ||
		typeof shippingAddress !== "object" ||
		Array.isArray(shippingAddress)
	) {
		return { recipient: null, lines: [] };
	}
	const address = shippingAddress as Record<string, unknown>;
	const text = (key: string) =>
		typeof address[key] === "string" ? (address[key] as string) : "";
	const street = [text("line1"), text("line2")].filter(Boolean).join(", ");
	const town = [text("city"), text("region")].filter(Boolean).join(", ");
	return {
		recipient: text("recipientName") || null,
		lines: [street, town].filter(Boolean),
	};
}

/**
 * One serialisable view of an order for the sheet and the full page. Dates
 * leave here as ISO strings — the client sheet receives this shape over the
 * wire, so nothing may carry a Date or a Prisma object across.
 */
export function toAdminOrderDetail(order: AdminOrderRecord): AdminOrderDetail {
	const { recipient, lines } = readAddress(order.shippingAddress);
	return {
		id: order.id,
		orderNumber: order.orderNumber,
		placedAt: order.placedAt.toISOString(),
		status: order.status as OrderStatusKey,
		paymentStatus: order.paymentStatus,
		paymentMethod: order.paymentMethod,
		currency: order.currency,
		customerName:
			recipient ?? order.user?.name ?? order.customerEmail.split("@")[0],
		customerEmail: order.customerEmail,
		customerPhone: order.customerPhone,
		accountName: order.user?.name ?? null,
		addressLines: lines,
		customerNote: order.customerNote,
		items: order.items.map((item) => ({
			id: item.id,
			productId: item.productId,
			productName: item.productName,
			variantName: item.variantName,
			sku: item.sku,
			imageUrl: item.imageUrl,
			unitPriceInPesewas: item.unitPriceInPesewas,
			quantity: item.quantity,
			lineTotalInPesewas: item.lineTotalInPesewas,
		})),
		subtotalInPesewas: order.subtotalInPesewas,
		deliveryInPesewas: order.deliveryInPesewas,
		discountInPesewas: order.discountInPesewas,
		totalInPesewas: order.totalInPesewas,
		transactions: order.transactions.map((transaction) => ({
			id: transaction.id,
			reference: transaction.reference,
			provider: transaction.provider,
			paymentMethod: transaction.paymentMethod,
			status: transaction.status,
			amountInPesewas: transaction.amountInPesewas,
			providerPaymentId: transaction.providerPaymentId,
			processedAt: transaction.processedAt?.toISOString() ?? null,
			createdAt: transaction.createdAt.toISOString(),
		})),
		events: order.statusEvents.map((event) => ({
			id: event.id,
			status: event.status as OrderStatusKey,
			note: event.note,
			createdAt: event.createdAt.toISOString(),
		})),
		isClosed: ["DELIVERED", "CANCELLED", "REFUNDED"].includes(order.status),
	};
}
