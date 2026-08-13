import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createMockOrder } from "./order.ts";

describe("createMockOrder", () => {
	it("creates the order shown to a customer after a valid mock checkout", () => {
		const order = createMockOrder({
			customer: {
				name: "Abena Mensah",
				email: "abena@example.com",
				phone: "+233 24 555 0192",
			},
			address: {
				line1: "14 Independence Avenue",
				city: "Accra",
				region: "Greater Accra",
			},
			items: [
				{
					productId: "audio-1",
					name: "JBL Charge 5",
					slug: "jbl-charge-5",
					imageUrl: "https://example.com/jbl.jpg",
					priceInPesewas: 145_000,
					quantity: 1,
					stockQuantity: 9,
				},
			],
			now: new Date("2026-08-13T10:30:00.000Z"),
			orderToken: "a7k2",
		});

		assert.deepEqual(order, {
			id: "GST-20260813-A7K2",
			status: "confirmed",
			paymentStatus: "paid",
			paymentMethod: "mock",
			placedAt: "2026-08-13T10:30:00.000Z",
			customer: {
				name: "Abena Mensah",
				email: "abena@example.com",
				phone: "+233 24 555 0192",
			},
			address: {
				line1: "14 Independence Avenue",
				city: "Accra",
				region: "Greater Accra",
			},
			items: [
				{
					productId: "audio-1",
					name: "JBL Charge 5",
					slug: "jbl-charge-5",
					imageUrl: "https://example.com/jbl.jpg",
					priceInPesewas: 145_000,
					quantity: 1,
					stockQuantity: 9,
					lineTotalInPesewas: 145_000,
				},
			],
			itemCount: 1,
			subtotalInPesewas: 145_000,
			deliveryInPesewas: 0,
			totalInPesewas: 145_000,
		});
	});
});
