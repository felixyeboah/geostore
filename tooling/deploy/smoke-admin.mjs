import assert from "node:assert/strict";

const [storefrontOrigin, adminOrigin] = process.argv.slice(2);
assert(
	storefrontOrigin && adminOrigin,
	"Usage: node tooling/deploy/smoke-admin.mjs https://storefront.example https://admin.example",
);
const storefront = new URL(storefrontOrigin);
const admin = new URL(adminOrigin);
assert(["http:", "https:"].includes(storefront.protocol));
assert(["http:", "https:"].includes(admin.protocol));
assert.notEqual(storefront.origin, admin.origin);

async function request(origin, path) {
	return fetch(new URL(path, origin), {
		redirect: "manual",
		signal: AbortSignal.timeout(30000),
	});
}

for (const path of [
	"/admin",
	"/admin/overview",
	"/admin/products?page=2",
	"/login",
	"/forgot-password",
	"/reset-password?token=smoke-test-token",
	"/verify",
]) {
	const response = await request(storefront, path);
	assert.equal(response.status, 307, `Storefront ${path}`);
	assert.equal(response.headers.get("location"), new URL(path, admin).href);
}

const adminIndex = await request(admin, "/admin");
assert.equal(adminIndex.status, 308);
assert.equal(
	new URL(adminIndex.headers.get("location"), admin).pathname,
	"/admin/overview",
);

for (const path of ["/admin/overview", "/admin/products", "/admin/users"]) {
	const response = await request(admin, path);
	assert.equal(response.status, 307, `Signed-out admin ${path}`);
	assert.equal(
		new URL(response.headers.get("location"), admin).href,
		new URL("/login", admin).href,
	);
}

const login = await request(admin, "/login");
assert.equal(login.status, 200);
const html = await login.text();
assert(html.includes('type="password"'), "Login has no password field");
assert(html.includes('name="email"'), "Login has no email field");
assert(!/data-dgst="(?!NEXT_REDIRECT)[^"]+"/.test(html), "Login render error");

const session = await request(admin, "/api/auth/get-session");
assert.equal(session.status, 200);
assert.equal(await session.json(), null, "Anonymous session must be null");
console.log("Admin routing, login and signed-out access checks passed.");
