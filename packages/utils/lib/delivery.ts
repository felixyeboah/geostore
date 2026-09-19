/**
 * The delivery rule, in one place. It used to be written out three times — the
 * cart summary the customer reads, and two copies inside the order-creation
 * transactions — which meant an empty-cart subtotal was quoted at GH₵0.00
 * delivery on screen but charged GH₵35.00 by the server. Both sides now call
 * this.
 */
export const FREE_DELIVERY_THRESHOLD_IN_PESEWAS = 100_000;
export const STANDARD_DELIVERY_FEE_IN_PESEWAS = 3_500;

export function calculateDeliveryFeeInPesewas(subtotalInPesewas: number) {
	if (
		subtotalInPesewas <= 0 ||
		subtotalInPesewas >= FREE_DELIVERY_THRESHOLD_IN_PESEWAS
	) {
		return 0;
	}

	return STANDARD_DELIVERY_FEE_IN_PESEWAS;
}
