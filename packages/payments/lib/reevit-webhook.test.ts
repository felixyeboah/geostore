import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { signWebhookPayload } from "@reevit/node";
import { verifyReevitWebhook } from "./reevit-webhook.ts";

const SECRET = "whsec_test";
const NOW_MS = 1_700_000_000_000;
const now = () => NOW_MS;

/** A body shaped like a real delivery, signed at `atSeconds`. */
function delivery(
	atSeconds = NOW_MS / 1000,
	extra: Record<string, unknown> = {},
) {
	const body = JSON.stringify({
		id: "evt_1",
		type: "payment.succeeded",
		signature_timestamp: atSeconds,
		...extra,
	});
	return { body, signature: signWebhookPayload(body, SECRET) };
}

describe("verifyReevitWebhook", () => {
	it("accepts a fresh, correctly signed delivery", async () => {
		const { body, signature } = delivery();
		assert.deepEqual(
			await verifyReevitWebhook(body, signature, SECRET, { now }),
			{ ok: true },
		);
	});

	it("interoperates with the SDK's own signing format", async () => {
		// Guards against drift if the SDK ever changes its prefix or encoding.
		const { body, signature } = delivery();
		assert.ok(signature.startsWith("sha256="));
		assert.equal(signature.length, "sha256=".length + 64);
		assert.equal(
			(await verifyReevitWebhook(body, signature, SECRET, { now })).ok,
			true,
		);
	});

	it("rejects a tampered body", async () => {
		const { signature } = delivery();
		const tampered = JSON.stringify({
			id: "evt_1",
			type: "payment.failed",
			signature_timestamp: NOW_MS / 1000,
		});
		assert.deepEqual(
			await verifyReevitWebhook(tampered, signature, SECRET, { now }),
			{ ok: false, reason: "signature" },
		);
	});

	it("rejects the wrong secret", async () => {
		const { body, signature } = delivery();
		assert.deepEqual(
			await verifyReevitWebhook(body, signature, "whsec_other", { now }),
			{ ok: false, reason: "signature" },
		);
	});

	it("rejects a missing sha256 prefix", async () => {
		const { body } = delivery();
		assert.deepEqual(
			await verifyReevitWebhook(body, "deadbeef", SECRET, { now }),
			{ ok: false, reason: "malformed" },
		);
	});

	it("rejects a missing signature header", async () => {
		const { body } = delivery();
		assert.deepEqual(
			await verifyReevitWebhook(body, null, SECRET, { now }),
			{
				ok: false,
				reason: "malformed",
			},
		);
	});

	it("rejects a missing secret", async () => {
		const { body, signature } = delivery();
		assert.deepEqual(
			await verifyReevitWebhook(body, signature, undefined, { now }),
			{ ok: false, reason: "malformed" },
		);
	});

	it("rejects a replay of a valid delivery captured an hour ago", async () => {
		const { body, signature } = delivery(NOW_MS / 1000 - 3600);
		assert.deepEqual(
			await verifyReevitWebhook(body, signature, SECRET, { now }),
			{ ok: false, reason: "stale" },
		);
	});

	it("rejects a timestamp far in the future", async () => {
		const { body, signature } = delivery(NOW_MS / 1000 + 3600);
		assert.deepEqual(
			await verifyReevitWebhook(body, signature, SECRET, { now }),
			{ ok: false, reason: "stale" },
		);
	});

	it("accepts a delivery just inside the tolerance", async () => {
		const { body, signature } = delivery(NOW_MS / 1000 - 299);
		assert.equal(
			(await verifyReevitWebhook(body, signature, SECRET, { now })).ok,
			true,
		);
	});

	it("rejects a delivery just outside the tolerance", async () => {
		const { body, signature } = delivery(NOW_MS / 1000 - 301);
		assert.deepEqual(
			await verifyReevitWebhook(body, signature, SECRET, { now }),
			{ ok: false, reason: "stale" },
		);
	});

	it("refuses a signed body with no timestamp, rather than assuming freshness", async () => {
		const body = JSON.stringify({ id: "evt_1", type: "payment.succeeded" });
		assert.deepEqual(
			await verifyReevitWebhook(
				body,
				signWebhookPayload(body, SECRET),
				SECRET,
				{ now },
			),
			{ ok: false, reason: "malformed" },
		);
	});
});
