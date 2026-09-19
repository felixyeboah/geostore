/**
 * Reevit webhook verification, implemented against the wire format rather than
 * the SDK.
 *
 * Two reasons not to call `@reevit/node` here. It reaches for `node:crypto` and
 * drags in axios, which is the one genuinely Node-only dependency on the
 * webhook path. And the SDK's own verifier stops at the signature — its
 * docblock tells you to check `signature_timestamp` freshness yourself, which
 * the route never did, leaving an unbounded replay window once the idempotency
 * claim row is pruned.
 *
 * Wire format, matching `signWebhookPayload` in the SDK:
 *   X-Reevit-Signature: sha256=<hex HMAC-SHA256 of the exact raw body>
 *
 * The signature covers the raw bytes, so the body must not be parsed and
 * re-serialised before verifying — key order and whitespace have to match.
 */

const SIGNATURE_PREFIX = "sha256=";
const DEFAULT_TOLERANCE_SECONDS = 300;

export type ReevitVerificationFailure = "malformed" | "signature" | "stale";

export type ReevitVerificationResult =
	| { ok: true }
	| { ok: false; reason: ReevitVerificationFailure };

const encoder = new TextEncoder();

async function hmacHex(secret: string, body: string): Promise<string> {
	const key = await crypto.subtle.importKey(
		"raw",
		encoder.encode(secret),
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["sign"],
	);
	const signature = await crypto.subtle.sign(
		"HMAC",
		key,
		encoder.encode(body),
	);

	return Array.from(new Uint8Array(signature))
		.map((byte) => byte.toString(16).padStart(2, "0"))
		.join("");
}

/**
 * Compares two fixed-length hex strings without an early exit.
 *
 * The length is public (`"sha256="` plus 64 hex characters), so returning early
 * on a length mismatch leaks nothing.
 */
function constantTimeEqual(a: string, b: string): boolean {
	if (a.length !== b.length) {
		return false;
	}

	let difference = 0;
	for (let i = 0; i < a.length; i++) {
		difference |= a.charCodeAt(i) ^ b.charCodeAt(i);
	}

	return difference === 0;
}

function readTimestampSeconds(rawBody: string): number | null {
	let parsed: unknown;

	try {
		parsed = JSON.parse(rawBody);
	} catch {
		return null;
	}

	if (typeof parsed !== "object" || parsed === null) {
		return null;
	}

	const value = (parsed as { signature_timestamp?: unknown })
		.signature_timestamp;
	const seconds =
		typeof value === "number" ? value : Number.parseInt(String(value), 10);

	return Number.isFinite(seconds) ? seconds : null;
}

export async function verifyReevitWebhook(
	rawBody: string,
	signatureHeader: string | null | undefined,
	secret: string | undefined,
	options: { toleranceSeconds?: number; now?: () => number } = {},
): Promise<ReevitVerificationResult> {
	const { toleranceSeconds = DEFAULT_TOLERANCE_SECONDS, now = Date.now } =
		options;

	if (!secret || !signatureHeader?.startsWith(SIGNATURE_PREFIX)) {
		return { ok: false, reason: "malformed" };
	}

	const expected = SIGNATURE_PREFIX + (await hmacHex(secret, rawBody));

	if (!constantTimeEqual(expected, signatureHeader)) {
		return { ok: false, reason: "signature" };
	}

	// Only trustworthy once the signature has passed, since the signature is
	// what makes the timestamp tamper-proof.
	const timestampSeconds = readTimestampSeconds(rawBody);

	if (timestampSeconds === null) {
		// A body Reevit signed always carries the field. Its absence means we
		// cannot bound the replay window, so refuse rather than assume.
		return { ok: false, reason: "malformed" };
	}

	const ageSeconds = Math.abs(now() / 1000 - timestampSeconds);

	if (ageSeconds > toleranceSeconds) {
		return { ok: false, reason: "stale" };
	}

	return { ok: true };
}
