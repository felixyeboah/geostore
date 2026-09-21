import assert from "node:assert/strict";
import { setTimeout as delay } from "node:timers/promises";

const origin = process.argv[2];
assert(
	origin,
	"Usage: node tooling/deploy/smoke.mjs https://storefront.example",
);
const base = new URL(origin);
assert(["http:", "https:"].includes(base.protocol));
const headers = {
	"user-agent":
		"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36",
	accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
	"accept-language": "en-US,en;q=0.9",
};
async function probe(route) {
	const response = await fetch(new URL(route, base), {
		headers,
		signal: AbortSignal.timeout(30000),
	});
	const body = await response.text();
	assert.equal(
		response.status,
		200,
		`${route}: ${response.status}: ${body.slice(0, 120)}`,
	);
	if (route.startsWith("/api/search")) {
		const data = JSON.parse(body);
		assert(Array.isArray(data.products) && data.products.length <= 6);
		assert.equal(typeof data.total, "number");
		if (route.includes("zzzxxyy-no-match")) {
			assert.equal(data.total, 0);
		}
	} else {
		assert(body.includes("<html"), `${route}: missing HTML`);
		assert(
			!/data-dgst="(?!NEXT_REDIRECT)[^"]+"/.test(body),
			`${route}: streamed rendering error`,
		);
		assert(!body.includes("error code: 1101"), `${route}: Worker error`);
	}
}
for (let round = 1; round <= 5; round++) {
	await Promise.all(["/", "/shop", "/cart", "/contact"].map(probe));
	await probe("/api/search?q=iphone");
	await probe("/api/search?q=zzzxxyy-no-match");
	console.log(`Round ${round}: six routes passed`);
	if (round < 5) {
		await delay(10000);
	}
}
