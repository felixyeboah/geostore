import { type CalculatedCartItem, type CartLine, calculateCart } from "./cart";

export const MOCK_ORDERS_STORAGE_KEY = "geostoresgh-mock-orders-v1";

export interface MockOrderCustomer {
	name: string;
	email: string;
	phone: string;
}

export interface MockOrderAddress {
	line1: string;
	line2?: string;
	city: string;
	region: string;
}

export interface CreateMockOrderInput {
	customer: MockOrderCustomer;
	address: MockOrderAddress;
	items: CartLine[];
	now: Date;
	orderToken: string;
}

export interface MockOrder {
	id: string;
	status:
		| "pending"
		| "confirmed"
		| "processing"
		| "out-for-delivery"
		| "delivered"
		| "cancelled"
		| "refunded";
	paymentStatus: "pending" | "paid" | "failed" | "refunded";
	paymentMethod: string;
	placedAt: string;
	customer: MockOrderCustomer;
	address: MockOrderAddress;
	items: Array<
		CalculatedCartItem & { orderItemId?: string; hasReview?: boolean }
	>;
	itemCount: number;
	subtotalInPesewas: number;
	deliveryInPesewas: number;
	totalInPesewas: number;
}

function formatOrderDate(date: Date): string {
	const year = date.getUTCFullYear();
	const month = String(date.getUTCMonth() + 1).padStart(2, "0");
	const day = String(date.getUTCDate()).padStart(2, "0");
	return `${year}${month}${day}`;
}

export function createMockOrder(input: CreateMockOrderInput): MockOrder {
	const cart = calculateCart(input.items);

	if (!cart.canCheckout) {
		throw new Error("A mock order requires at least one cart item.");
	}

	return {
		id: `GST-${formatOrderDate(input.now)}-${input.orderToken.toUpperCase()}`,
		status: "confirmed",
		paymentStatus: "paid",
		paymentMethod: "mock",
		placedAt: input.now.toISOString(),
		customer: input.customer,
		address: input.address,
		items: cart.items,
		itemCount: cart.itemCount,
		subtotalInPesewas: cart.subtotalInPesewas,
		deliveryInPesewas: cart.deliveryInPesewas,
		totalInPesewas: cart.totalInPesewas,
	};
}
