import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import manifest from "./catalogue-sources.json";

test("catalogue assets retain their reviewed product-specific provenance", async () => {
	const keys = new Set<string>();
	const paths = new Set<string>();
	const hashes = new Set<string>();
	for (const product of manifest.products) {
		assert.ok(!keys.has(product.key), `Duplicate product ${product.key}`);
		keys.add(product.key);
		assert.ok(product.sourceUrls.length > 0);
		assert.ok(product.images.length > 0);
		for (const image of product.images) {
			assert.match(
				image.path,
				new RegExp(
					`^/images/catalogue/${product.key}\\.(jpg|png|webp)$`,
				),
			);
			assert.ok(
				!paths.has(image.path),
				`Image reused across products: ${image.path}`,
			);
			assert.ok(
				!hashes.has(image.sha256),
				`Identical image reused: ${product.key}`,
			);
			assert.equal(image.visuallyInspected, true);
			assert.ok(image.inspectionNote.length > 0);
			assert.equal(new URL(image.sourceUrl).protocol, "https:");
			const file = new URL(
				`../../apps/marketing/public${image.path}`,
				import.meta.url,
			);
			const bytes = await readFile(file);
			assert.equal(
				createHash("sha256").update(bytes).digest("hex"),
				image.sha256,
				`Unreviewed replacement: ${image.path}`,
			);
			paths.add(image.path);
			hashes.add(image.sha256);
		}
	}
});
