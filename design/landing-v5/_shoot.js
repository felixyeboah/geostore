/* Screenshot + smoke-test helper for the landing mockups.
   usage: node design/landing-v5/_shoot.js <page.html> [width] [--test]
   Writes /tmp/geo-<page>-<width>.png (full page) and prints console errors. */
const path = require("path");
const fs = require("fs");
const root = path.resolve(__dirname, "../..");
const pwDir = fs
	.readdirSync(path.join(root, "node_modules/.pnpm"))
	.filter((d) => /^playwright@/.test(d))
	.sort()
	.pop();
const { chromium } = require(path.join(root, "node_modules/.pnpm", pwDir, "node_modules/playwright"));

(async () => {
	const [, , page = "index.html", widthArg = "1440", ...flags] = process.argv;
	const width = Number(widthArg);
	const doTest = flags.includes("--test");
	const browser = await chromium.launch();
	const ctx = await browser.newContext({ viewport: { width, height: 900 }, deviceScaleFactor: 1 });
	const p = await ctx.newPage();
	const errors = [];
	p.on("pageerror", (e) => errors.push("pageerror: " + e.message));
	p.on("console", (m) => {
		if (m.type() === "error") errors.push("console: " + m.text());
	});
	await p.goto(`http://localhost:8787/landing-v5/${page}`, { waitUntil: "networkidle", timeout: 30000 }).catch(async () => {
		await p.goto(`http://localhost:8787/landing-v5/${page}`, { waitUntil: "load" });
	});
	await p.waitForTimeout(600);
	// Walk the page so lazy images are requested before a fullPage capture.
	await p.evaluate(async () => {
		for (let y = 0; y < document.body.scrollHeight; y += 600) {
			window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 80));
		}
		window.scrollTo(0, 0);
	});
	await p.waitForTimeout(1200);
	const overflow = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
	const openFlag = flags.find((f) => f.startsWith("--open="));
	let suffix = "";
	if (openFlag) {
		const what = openFlag.split("=")[1];
		suffix = "-" + what;
		if (what === "drawer") {
			await p.evaluate(() => {
				GEO.cart.add("prod_iphone_15_pro", 1, { silent: true });
				GEO.cart.add("prod_airpods_pro_2", 2, { silent: true });
				GEO.openCart();
			});
		} else if (what === "drawer-empty") {
			await p.evaluate(() => GEO.openCart());
		} else if (what === "qv") {
			await p.evaluate(() => GEO.openQuickView("prod_iphone_15_pro"));
		} else if (what === "search") {
			const s = p.locator('input[type="search"]').first();
			await s.click();
			await s.fill("gal");
		}
		await p.waitForTimeout(500);
	}
	const out = `/tmp/geo-${page.replace(/\.html$/, "")}-${width}${suffix}.png`;
	await p.screenshot({ path: out, fullPage: !openFlag });
	if (openFlag) await p.evaluate(() => { GEO.cart.clear(); localStorage.clear(); });
	console.log("saved", out, "| horizontal overflow px:", overflow);

	if (doTest) {
		const r = {};
		r.products = await p.evaluate(() => window.GEO && GEO.products.length);
		// add to bag from first data-add
		const add = p.locator("[data-add]").first();
		r.addButtons = await p.locator("[data-add]").count();
		if (r.addButtons) {
			await add.scrollIntoViewIfNeeded();
			await add.click();
			await p.waitForTimeout(300);
			r.cartCountAfterAdd = await p.evaluate(() => GEO.cart.count());
			r.badge = await p.locator("[data-cart-count]").first().textContent();
		}
		// open drawer
		if (await p.locator("[data-cart-open]").count()) {
			await p.locator("[data-cart-open]").first().click();
			await p.waitForTimeout(400);
			r.drawerOpen = await p.evaluate(() => document.getElementById("geo-cart").classList.contains("is-open"));
			r.drawerLines = await p.locator(".geo-line").count();
			await p.keyboard.press("Escape");
			await p.waitForTimeout(300);
			r.drawerClosedByEsc = await p.evaluate(() => !document.getElementById("geo-cart").classList.contains("is-open"));
		}
		// quick view
		if (await p.locator("[data-quickview]").count()) {
			await p.evaluate(() => document.querySelector("[data-quickview]").click());
			await p.waitForTimeout(400);
			r.qvOpen = await p.evaluate(() => document.getElementById("geo-qv").classList.contains("is-open"));
			r.qvName = await p.locator("#geo-qv-name").textContent();
			await p.keyboard.press("Escape");
		}
		// wishlist
		if (await p.locator("[data-wishlist]").count()) {
			const w = p.locator("[data-wishlist]").first();
			await w.scrollIntoViewIfNeeded();
			await w.click();
			await p.waitForTimeout(200);
			r.wishlistSize = await p.evaluate(() => GEO.wishlist.ids.size);
			await w.click();
		}
		// search
		const searches = p.locator('input[type="search"], input[type="text"][placeholder*="earch"]');
		if (await searches.count()) {
			let search = null;
			for (let i = 0; i < (await searches.count()); i++) {
				if (await searches.nth(i).isVisible()) { search = searches.nth(i); break; }
			}
			if (search) {
				await search.scrollIntoViewIfNeeded();
				await search.fill("air");
			} else {
				r.searchHiddenUsedJs = true;
				await searches.first().evaluate((el) => { el.value = "air"; el.dispatchEvent(new Event("input", { bubbles: true })); });
			}
			await p.waitForTimeout(250);
			r.suggestOpen = await p.evaluate(() => !!document.querySelector(".geo-suggest.is-open"));
			r.suggestItems = await p.locator(".geo-suggest.is-open .geo-suggest__item").count();
			await searches.first().evaluate((el) => { el.value = ""; el.dispatchEvent(new Event("input", { bubbles: true })); });
			await p.keyboard.press("Escape");
		}
		// accordion
		if (await p.locator("[data-accordion] > button").count()) {
			const b = p.locator("[data-accordion] > button").first();
			await b.scrollIntoViewIfNeeded();
			await b.click();
			r.accordionExpanded = await b.getAttribute("aria-expanded");
		}
		// newsletter
		if (await p.locator("form[data-newsletter]").count()) {
			const f = p.locator("form[data-newsletter]").first();
			await f.scrollIntoViewIfNeeded();
			await f.locator('input[type="email"]').fill("bad");
			await f.locator('button[type="submit"]').click();
			r.newsletterError = await f.evaluate((el) => el.classList.contains("is-error"));
			await f.locator('input[type="email"]').fill("kofi@example.com");
			await f.locator('button[type="submit"]').click();
			await p.waitForTimeout(200);
			r.newsletterDone = await f.evaluate((el) => el.classList.contains("is-done"));
		}
		// links sanity
		r.hashLinks = await p.evaluate(() => Array.from(document.querySelectorAll('a[href="#"]')).length);
		r.storeLinks = await p.evaluate(() => Array.from(document.querySelectorAll('a[href^="http://localhost:3000"]')).length);
		r.deadButtons = await p.evaluate(() => {
			const btns = Array.from(document.querySelectorAll("button"));
			return btns.filter((b) => {
				const hasHook = Array.from(b.attributes).some((a) => a.name.startsWith("data-")) || b.type === "submit" || b.closest("form");
				return !hasHook && !b.id && !b.className;
			}).length;
		});
		await p.evaluate(() => { GEO.cart.clear(); localStorage.clear(); });
		console.log(JSON.stringify(r, null, 2));
	}
	if (errors.length) console.log("ERRORS:\n" + errors.join("\n"));
	else console.log("no console errors");
	await browser.close();
})();
