import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
	createOrderAccessToken,
	getOrderTokenSecrets,
	verifyOrderAccessToken,
} from "./order-token";

/** Runs `fn` with the given env applied, restoring whatever was there before. */
function withEnv<T>(env: Record<string, string | undefined>, fn: () => T): T {
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
		return fn();
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

const ORDER = "order_abc123";
const CURRENT = "order-secret-current";
const PREVIOUS = "order-secret-previous";
const SESSION = "better-auth-session-secret";

/** Only the dedicated key is configured, with legacy acceptance switched off. */
const ISOLATED = {
	ORDER_TOKEN_SECRET: CURRENT,
	ORDER_TOKEN_SECRET_PREVIOUS: undefined,
	BETTER_AUTH_SECRET: undefined,
	ORDER_TOKEN_ACCEPT_LEGACY: undefined,
};

describe("order access tokens", () => {
	it("accepts a token it just minted", () => {
		withEnv(ISOLATED, () => {
			const token = createOrderAccessToken(ORDER);
			assert.equal(verifyOrderAccessToken(ORDER, token), true);
		});
	});

	it("binds the token to one order id", () => {
		withEnv(ISOLATED, () => {
			const token = createOrderAccessToken(ORDER);
			assert.equal(verifyOrderAccessToken("order_other", token), false);
		});
	});

	it("rejects a missing or empty token", () => {
		withEnv(ISOLATED, () => {
			assert.equal(verifyOrderAccessToken(ORDER, undefined), false);
			assert.equal(verifyOrderAccessToken(ORDER, ""), false);
		});
	});

	it("rejects a token of the right shape but the wrong value", () => {
		withEnv(ISOLATED, () => {
			const token = createOrderAccessToken(ORDER);
			const tampered = `${token.slice(0, -1)}${token.endsWith("A") ? "B" : "A"}`;
			assert.equal(tampered.length, token.length);
			assert.equal(verifyOrderAccessToken(ORDER, tampered), false);
		});
	});

	it("throws rather than signing with no secret at all", () => {
		withEnv(
			{ ORDER_TOKEN_SECRET: undefined, BETTER_AUTH_SECRET: undefined },
			() => {
				assert.throws(
					() => createOrderAccessToken(ORDER),
					/ORDER_TOKEN_SECRET/,
				);
			},
		);
	});
});

describe("order token rotation", () => {
	it("signs with the current key while still accepting the previous one", () => {
		const oldToken = withEnv(
			{ ...ISOLATED, ORDER_TOKEN_SECRET: PREVIOUS },
			() => createOrderAccessToken(ORDER),
		);

		withEnv({ ...ISOLATED, ORDER_TOKEN_SECRET_PREVIOUS: PREVIOUS }, () => {
			// The link already in a customer's inbox keeps working...
			assert.equal(verifyOrderAccessToken(ORDER, oldToken), true);
			// ...but new links are minted with the current key.
			const fresh = createOrderAccessToken(ORDER);
			assert.notEqual(fresh, oldToken);
			assert.equal(verifyOrderAccessToken(ORDER, fresh), true);
		});
	});

	it("stops accepting the previous key once it is removed", () => {
		const oldToken = withEnv(
			{ ...ISOLATED, ORDER_TOKEN_SECRET: PREVIOUS },
			() => createOrderAccessToken(ORDER),
		);

		withEnv(ISOLATED, () => {
			assert.equal(verifyOrderAccessToken(ORDER, oldToken), false);
		});
	});

	it("still honours tokens signed with the session secret before the split", () => {
		const legacyToken = withEnv(
			{
				ORDER_TOKEN_SECRET: undefined,
				ORDER_TOKEN_SECRET_PREVIOUS: undefined,
				BETTER_AUTH_SECRET: SESSION,
				ORDER_TOKEN_ACCEPT_LEGACY: undefined,
			},
			() => createOrderAccessToken(ORDER),
		);

		withEnv({ ...ISOLATED, BETTER_AUTH_SECRET: SESSION }, () => {
			assert.equal(verifyOrderAccessToken(ORDER, legacyToken), true);
		});
	});

	it("closes the legacy door when ORDER_TOKEN_ACCEPT_LEGACY is false", () => {
		const legacyToken = withEnv(
			{
				ORDER_TOKEN_SECRET: undefined,
				ORDER_TOKEN_SECRET_PREVIOUS: undefined,
				BETTER_AUTH_SECRET: SESSION,
				ORDER_TOKEN_ACCEPT_LEGACY: undefined,
			},
			() => createOrderAccessToken(ORDER),
		);

		withEnv(
			{
				...ISOLATED,
				BETTER_AUTH_SECRET: SESSION,
				ORDER_TOKEN_ACCEPT_LEGACY: "false",
			},
			() => {
				assert.equal(verifyOrderAccessToken(ORDER, legacyToken), false);
			},
		);
	});

	it("falls back to the session secret when no dedicated key is set", () => {
		withEnv(
			{
				ORDER_TOKEN_SECRET: undefined,
				ORDER_TOKEN_SECRET_PREVIOUS: undefined,
				BETTER_AUTH_SECRET: SESSION,
				ORDER_TOKEN_ACCEPT_LEGACY: undefined,
			},
			() => {
				assert.equal(getOrderTokenSecrets().signing, SESSION);
			},
		);
	});

	it("does not list the same secret twice when the keys coincide", () => {
		withEnv(
			{
				ORDER_TOKEN_SECRET: SESSION,
				ORDER_TOKEN_SECRET_PREVIOUS: undefined,
				BETTER_AUTH_SECRET: SESSION,
				ORDER_TOKEN_ACCEPT_LEGACY: undefined,
			},
			() => {
				assert.deepEqual(getOrderTokenSecrets().accepted, [SESSION]);
			},
		);
	});
});
