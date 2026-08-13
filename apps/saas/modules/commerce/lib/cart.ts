export const FREE_DELIVERY_THRESHOLD_IN_PESEWAS = 100_000;
export const STANDARD_DELIVERY_FEE_IN_PESEWAS = 3_500;

export interface CartItemInput {
	productId: string;
	name: string;
	priceInPesewas: number;
	quantity: number;
	stockQuantity: number;
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

export function calculateCart(items: CartItemInput[]): CartSummary {
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
	const deliveryInPesewas =
		subtotalInPesewas === 0 ||
		subtotalInPesewas >= FREE_DELIVERY_THRESHOLD_IN_PESEWAS
			? 0
			: STANDARD_DELIVERY_FEE_IN_PESEWAS;

	return {
		items: calculatedItems,
		itemCount,
		subtotalInPesewas,
		deliveryInPesewas,
		totalInPesewas: subtotalInPesewas + deliveryInPesewas,
		amountUntilFreeDeliveryInPesewas: Math.max(
			FREE_DELIVERY_THRESHOLD_IN_PESEWAS - subtotalInPesewas,
			0,
		),
		canCheckout: calculatedItems.length > 0,
	};
}
