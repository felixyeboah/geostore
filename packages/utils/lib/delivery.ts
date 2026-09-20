/**
 * The delivery rule, in one place. It used to be written out three times — the
 * cart summary the customer reads, and two copies inside the order-creation
 * transactions — which meant an empty-cart subtotal was quoted at GH₵0.00
 * delivery on screen but charged GH₵35.00 by the server. Both sides now call
 * this.
 *
 * The numbers below are what the shop ships with, not what it necessarily
 * charges: an admin can change both under Settings, and the saved rule is
 * passed in. Order creation reads the rule from the database, so the figure
 * the browser quotes is only ever a quote.
 */

export interface DeliveryRule {
	/** Flat fee charged on orders below the free-delivery threshold. */
	feeInPesewas: number;
	/** Subtotal at or above which delivery is free. */
	freeOverInPesewas: number;
}

export const FREE_DELIVERY_THRESHOLD_IN_PESEWAS = 100_000;
export const STANDARD_DELIVERY_FEE_IN_PESEWAS = 3_500;

export const DEFAULT_DELIVERY_RULE: DeliveryRule = {
	feeInPesewas: STANDARD_DELIVERY_FEE_IN_PESEWAS,
	freeOverInPesewas: FREE_DELIVERY_THRESHOLD_IN_PESEWAS,
};

export function calculateDeliveryFeeInPesewas(
	subtotalInPesewas: number,
	rule: DeliveryRule = DEFAULT_DELIVERY_RULE,
) {
	// A threshold of zero is how "free delivery on everything" is expressed,
	// and it falls out of the same comparison.
	if (subtotalInPesewas <= 0 || subtotalInPesewas >= rule.freeOverInPesewas) {
		return 0;
	}

	return rule.feeInPesewas;
}
