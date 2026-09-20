/**
 * Boot-time configuration checks.
 *
 * Next calls `register()` once per server start, before the first request is
 * served. Throwing here takes the deployment down loudly, which is the point:
 * the failure modes below are all ones that otherwise stay silent until a
 * customer hits them — a store quietly running the mock payment provider, or
 * auth trusting `http://localhost:3000` as its origin.
 *
 * Only production is checked. Development and the Playwright build deliberately
 * run with a looser configuration.
 */

function missing(name: string): boolean {
	const value = process.env[name];
	return value === undefined || value.trim() === "";
}

export function register(): void {
	if (process.env.NODE_ENV !== "production") {
		return;
	}

	const allowMock = process.env.ALLOW_MOCK_PAYMENTS === "true";
	const problems: string[] = [];

	// --- Payments -----------------------------------------------------------
	const provider = process.env.STORE_PAYMENT_PROVIDER;

	if (provider !== "reevit" && !allowMock) {
		problems.push(
			`STORE_PAYMENT_PROVIDER must be "reevit" in production (received ${
				provider === undefined ? "no value" : `"${provider}"`
			}). The mock provider marks orders paid without charging.`,
		);
	}

	if (provider === "reevit") {
		for (const key of [
			"REEVIT_API_KEY",
			"REEVIT_ORG_ID",
			"REEVIT_WEBHOOK_SECRET",
		]) {
			if (missing(key)) {
				problems.push(
					`${key} is required when STORE_PAYMENT_PROVIDER="reevit".`,
				);
			}
		}
	}

	// --- Auth and origins ---------------------------------------------------
	if (missing("BETTER_AUTH_SECRET")) {
		problems.push("BETTER_AUTH_SECRET is required.");
	}

	// Order links are HMAC-signed with this. It falls back to
	// BETTER_AUTH_SECRET, which works but couples session rotation to the
	// validity of every order link already emailed out.
	if (missing("ORDER_TOKEN_SECRET")) {
		problems.push(
			"ORDER_TOKEN_SECRET is required so that order links are not signed with the session secret.",
		);
	}

	if (
		process.env.ORDER_TOKEN_SECRET &&
		process.env.ORDER_TOKEN_SECRET === process.env.BETTER_AUTH_SECRET
	) {
		problems.push(
			"ORDER_TOKEN_SECRET must differ from BETTER_AUTH_SECRET; sharing one value defeats the split.",
		);
	}

	// Falls back to http://localhost:3000 when unset, which silently becomes
	// Better Auth's trusted origin and the host in every order email link.
	if (missing("NEXT_PUBLIC_SAAS_URL")) {
		problems.push(
			"NEXT_PUBLIC_SAAS_URL is required; without it auth trusts localhost and order emails link to it.",
		);
	}

	// --- Database -----------------------------------------------------------
	if (missing("DATABASE_URL")) {
		problems.push("DATABASE_URL is required.");
	}

	if (problems.length > 0) {
		throw new Error(
			`Refusing to start with an unsafe configuration:\n  - ${problems.join("\n  - ")}`,
		);
	}
}
