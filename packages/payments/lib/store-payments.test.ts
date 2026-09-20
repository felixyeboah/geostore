import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { signWebhookPayload } from "@reevit/node";
import {
	getStorePaymentProvider,
	mapStorePaymentMethod,
	verifyReevitSignature,
} from "./store-payments.ts";

/** Runs `fn` with the given env applied, restoring whatever was there before. */
function withEnv(env: Record<string, string | undefined>, fn: () => void) {
	const previous = new Map<string, string | undefined>();
	for (const [key, value] of Object.entries(env)) {
		previous.set(key, process.env[key]);
		if (value === undefined) {
			delete process.env[key];
		} else {
			process.env[key] = value;
		}
	}
	try {
		fn();
	} finally {
		for (const [key, value] of previous) {
			if (value === undefined) {
				delete process.env[key];
			} else {
				process.env[key] = value;
			}
		}
	}
}

describe("getStorePaymentProvider", () => {
	it("returns reevit when explicitly configured", () => {
		withEnv({ STORE_PAYMENT_PROVIDER: "reevit" }, () => {
			assert.equal(getStorePaymentProvider(), "reevit");
		});
	});

	it("returns mock outside production when explicitly configured", () => {
		withEnv(
			{ STORE_PAYMENT_PROVIDER: "mock", NODE_ENV: "development" },
			() => {
				assert.equal(getStorePaymentProvider(), "mock");
			},
		);
	});

	it("never infers reevit from the presence of an API key", () => {
		withEnv(
			{
				STORE_PAYMENT_PROVIDER: undefined,
				REEVIT_API_KEY: "sk_live_something",
				NODE_ENV: "development",
			},
			() => {
				assert.equal(getStorePaymentProvider(), "mock");
			},
		);
	});

	it("throws in production when unset, rather than falling back to mock", () => {
		withEnv(
			{
				STORE_PAYMENT_PROVIDER: undefined,
				ALLOW_MOCK_PAYMENTS: undefined,
				NODE_ENV: "production",
			},
			() => {
				assert.throws(getStorePaymentProvider, /must be "reevit"/);
			},
		);
	});

	it("throws in production when explicitly set to mock", () => {
		withEnv(
			{
				STORE_PAYMENT_PROVIDER: "mock",
				ALLOW_MOCK_PAYMENTS: undefined,
				NODE_ENV: "production",
			},
			() => {
				assert.throws(getStorePaymentProvider, /refused in production/);
			},
		);
	});

	it("allows mock in a production build only with the explicit test opt-in", () => {
		withEnv(
			{
				STORE_PAYMENT_PROVIDER: "mock",
				ALLOW_MOCK_PAYMENTS: "true",
				NODE_ENV: "production",
			},
			() => {
				assert.equal(getStorePaymentProvider(), "mock");
			},
		);
	});
});

describe("verifyReevitSignature", () => {
	it("accepts a valid sha256 signature of the raw body", () => {
		const body = '{"id":"evt_1","type":"payment.succeeded"}';
		assert.equal(
			verifyReevitSignature(
				body,
				signWebhookPayload(body, "whsec_test"),
				"whsec_test",
			),
			true,
		);
	});

	it("rejects a tampered body", () => {
		const body = '{"id":"evt_1","type":"payment.succeeded"}';
		assert.equal(
			verifyReevitSignature(
				'{"id":"evt_1","type":"payment.failed"}',
				signWebhookPayload(body, "whsec_test"),
				"whsec_test",
			),
			false,
		);
	});

	it("rejects a missing sha256 prefix", () => {
		assert.equal(
			verifyReevitSignature("{}", "deadbeef", "whsec_test"),
			false,
		);
	});
});

describe("mapStorePaymentMethod", () => {
	it("maps store methods to Reevit methods", () => {
		assert.equal(mapStorePaymentMethod("MOBILE_MONEY"), "mobile_money");
		assert.equal(mapStorePaymentMethod("CARD"), "card");
		assert.equal(mapStorePaymentMethod("CASH_ON_DELIVERY"), null);
		assert.equal(mapStorePaymentMethod("MOCK"), null);
	});
});
