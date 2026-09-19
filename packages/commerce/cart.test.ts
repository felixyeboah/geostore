import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { calculateCart } from "./cart";

describe("calculateCart", () => {
	it("returns the customer-facing totals for a cart that qualifies for free delivery", () => {
		const result = calculateCart([
			{
				productId: "phone-1",
				name: "iPhone 15 Pro",
				priceInPesewas: 850_000,
				quantity: 1,
				stockQuantity: 4,
			},
			{
				productId: "case-1",
				name: "Protective case",
				priceInPesewas: 25_000,
				quantity: 2,
				stockQuantity: 12,
			},
		]);

		assert.deepEqual(result, {
			items: [
				{
					productId: "phone-1",
					name: "iPhone 15 Pro",
					priceInPesewas: 850_000,
					quantity: 1,
					stockQuantity: 4,
					lineTotalInPesewas: 850_000,
				},
				{
					productId: "case-1",
					name: "Protective case",
					priceInPesewas: 25_000,
					quantity: 2,
					stockQuantity: 12,
					lineTotalInPesewas: 50_000,
				},
			],
			itemCount: 3,
			subtotalInPesewas: 900_000,
			deliveryInPesewas: 0,
			totalInPesewas: 900_000,
			amountUntilFreeDeliveryInPesewas: 0,
			canCheckout: true,
		});
	});

	it("does not charge delivery or allow checkout for an empty cart", () => {
		assert.deepEqual(calculateCart([]), {
			items: [],
			itemCount: 0,
			subtotalInPesewas: 0,
			deliveryInPesewas: 0,
			totalInPesewas: 0,
			amountUntilFreeDeliveryInPesewas: 100_000,
			canCheckout: false,
		});
	});
});
