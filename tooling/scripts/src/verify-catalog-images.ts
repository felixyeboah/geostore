import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import manifest from "../../../packages/commerce/catalogue-sources.json";

async function main() {
	let checked = 0;
	for (const product of manifest.products) {
		for (const image of product.images) {
			const bytes = await readFile(
				fileURLToPath(
					new URL(
						`../../../apps/marketing/public${image.path}`,
						import.meta.url,
					),
				),
			);
			assert.equal(
				createHash("sha256").update(bytes).digest("hex"),
				image.sha256,
				`${product.key}: local asset changed`,
			);
			const response = await fetch(image.publicUrl, {
				signal: AbortSignal.timeout(30000),
			});
			assert.ok(response.ok, `${product.key}: HTTP ${response.status}`);
			assert.ok(
				response.headers.get("content-type")?.startsWith("image/"),
				`${product.key}: not an image response`,
			);
			const remote = Buffer.from(await response.arrayBuffer());
			assert.equal(
				createHash("sha256").update(remote).digest("hex"),
				image.sha256,
				`${product.key}: public image does not match reviewed source`,
			);
			checked += 1;
		}
	}
	console.info(
		`Verified ${checked} public images against reviewed source checksums.`,
	);
}

main().catch((error: unknown) => {
	console.error(error);
	process.exitCode = 1;
});
