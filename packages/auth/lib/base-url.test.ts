import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { getAuthBaseUrl } from "./base-url";

const previousNodeEnv = process.env.NODE_ENV;
before(() => {
	process.env.NODE_ENV = "production";
});
after(() => {
	if (previousNodeEnv === undefined) {
		delete process.env.NODE_ENV;
	} else {
		process.env.NODE_ENV = previousNodeEnv;
	}
});

test("SaaS remains the canonical auth origin when both apps are configured", () => {
	assert.equal(
		getAuthBaseUrl("https://admin.example.com", "https://shop.example.com"),
		"https://admin.example.com",
	);
});

test("storefront-only production supports absent and empty SaaS configuration", () => {
	for (const saasUrl of [undefined, ""]) {
		assert.equal(
			getAuthBaseUrl(saasUrl, "https://shop.example.com"),
			"https://shop.example.com",
		);
	}
});

test("production still rejects absent public origins", () => {
	assert.throws(() => getAuthBaseUrl(), /public base URL is required/);
	assert.throws(() => getAuthBaseUrl("", ""), /public base URL is required/);
});
