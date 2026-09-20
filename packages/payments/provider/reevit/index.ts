import { Reevit } from "@reevit/node";

let client: Reevit | null = null;

export function getReevitClient() {
	const apiKey = process.env.REEVIT_API_KEY;
	const orgId = process.env.REEVIT_ORG_ID;

	if (!apiKey || !orgId) {
		throw new Error(
			"Reevit is not configured. Set REEVIT_API_KEY and REEVIT_ORG_ID.",
		);
	}

	if (!client) {
		client = new Reevit(apiKey, orgId);
	}

	return client;
}

export async function createStorePaymentIntent(input: {
	amountInPesewas: number;
	/** Omit to let Reevit present every channel it supports for the country. */
	method?: "mobile_money" | "card";
	customerId: string;
	orderId: string;
	orderNumber: string;
}) {
	return getReevitClient().payments.createIntent(
		{
			amount: input.amountInPesewas,
			currency: "GHS",
			...(input.method ? { method: input.method } : {}),
			country: "GH",
			customer_id: input.customerId,
			reference: input.orderNumber,
			metadata: {
				order_id: input.orderId,
				order_number: input.orderNumber,
			},
		},
		{ idempotencyKey: input.orderId },
	);
}

export async function refundStorePayment(
	providerPaymentId: string,
	amountInPesewas: number,
	reason: string,
) {
	return getReevitClient().payments.refund(
		providerPaymentId,
		amountInPesewas,
		reason,
	);
}
