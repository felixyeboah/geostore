import {
	calculateDeliveryFeeInPesewas,
	DEFAULT_DELIVERY_RULE,
	type DeliveryRule,
} from "@repo/utils";

export {
	DEFAULT_DELIVERY_RULE,
	type DeliveryRule,
	FREE_DELIVERY_THRESHOLD_IN_PESEWAS,
	STANDARD_DELIVERY_FEE_IN_PESEWAS,
} from "@repo/utils";

export interface CartItemInput {
	productId: string;
	name: string;
	priceInPesewas: number;
	quantity: number;
	stockQuantity: number;
}

/** A line in the shopper's bag: a cart item plus what the UI needs to render it. */
export interface CartLine extends CartItemInput {
	variantId?: string;
	variantName?: string;
	slug: string;
	imageUrl: string;
}

export interface CalculatedCartItem extends CartItemInput {
	lineTotalInPesewas: number;
}

export interface CartSummary {
	items: CalculatedCartItem[];
	itemCount: number;
	subtotalInPesewas: number;
	deliveryInPesewas: number;
	totalInPesewas: number;
	amountUntilFreeDeliveryInPesewas: number;
	canCheckout: boolean;
}

/**
 * Prices a bag. The rule is passed in rather than read from a constant,
 * because an admin can change the fee and the threshold under Settings — and
 * a quote drawn from stale numbers is how the cart ends up disagreeing with
 * the checkout. Order creation prices against the saved rule too; this is only
 * what the shopper is shown.
 */
export function calculateCart(
	items: CartItemInput[],
	rule: DeliveryRule = DEFAULT_DELIVERY_RULE,
): CartSummary {
	const calculatedItems = items.map((item) => ({
		...item,
		lineTotalInPesewas: item.priceInPesewas * item.quantity,
	}));
	const itemCount = calculatedItems.reduce(
		(total, item) => total + item.quantity,
		0,
	);
	const subtotalInPesewas = calculatedItems.reduce(
		(total, item) => total + item.lineTotalInPesewas,
		0,
	);
	const deliveryInPesewas = calculateDeliveryFeeInPesewas(
		subtotalInPesewas,
		rule,
	);

	return {
		items: calculatedItems,
		itemCount,
		subtotalInPesewas,
		deliveryInPesewas,
		totalInPesewas: subtotalInPesewas + deliveryInPesewas,
		amountUntilFreeDeliveryInPesewas: Math.max(
			rule.freeOverInPesewas - subtotalInPesewas,
			0,
		),
		canCheckout: calculatedItems.length > 0,
	};
}
