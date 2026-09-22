import assert from "node:assert/strict";
import { test } from "node:test";
import manifest from "./catalogue-sources.json";
import {
	STORE_CATEGORIES,
	STORE_COLLECTIONS,
	STORE_PRODUCTS,
} from "./seed-catalog";
import { resolveOptionGallery } from "./variants";

test("seed catalogue identities and taxonomy references are unique and complete", () => {
	const ids = new Set<string>();
	const skus = new Set<string>();
	const slugs = new Set<string>();
	const categories = new Set(
		STORE_CATEGORIES.map((category) => category.slug),
	);
	const collections = new Set(
		STORE_COLLECTIONS.map((collection) => collection.slug),
	);
	assert.equal(categories.size, STORE_CATEGORIES.length);
	assert.equal(collections.size, STORE_COLLECTIONS.length);
	for (const product of STORE_PRODUCTS) {
		assert.ok(!ids.has(product.id));
		ids.add(product.id);
		assert.ok(!skus.has(product.sku));
		skus.add(product.sku);
		assert.ok(!slugs.has(product.slug));
		slugs.add(product.slug);
		assert.ok(categories.has(product.categorySlug), product.slug);
		for (const slug of product.collectionSlugs ?? []) {
			assert.ok(collections.has(slug));
		}
		for (const variant of product.variants ?? []) {
			assert.ok(!ids.has(variant.id));
			ids.add(variant.id);
			assert.ok(!skus.has(variant.sku));
			skus.add(variant.sku);
			assert.ok(variant.name.length > 0);
			assert.ok(Object.keys(variant.attributes).length > 0);
			assert.ok(
				Number.isSafeInteger(variant.priceInPesewas) &&
					variant.priceInPesewas > 0,
			);
			assert.ok(
				Number.isSafeInteger(variant.stockQuantity) &&
					variant.stockQuantity >= 0,
			);
		}
		if (product.variants?.length) {
			assert.equal(
				product.priceInPesewas,
				Math.min(
					...product.variants.map(
						(variant) => variant.priceInPesewas,
					),
				),
			);
			assert.equal(
				product.stockQuantity,
				product.variants.reduce(
					(sum, variant) => sum + variant.stockQuantity,
					0,
				),
			);
		}
	}
});

test("seed images belong to their documented product and contain no stock photography", () => {
	const imageOwners = new Map<string, string>();
	assert.equal(manifest.products.length, STORE_PRODUCTS.length);
	for (const product of STORE_PRODUCTS) {
		const source = manifest.products.find(
			(entry) => entry.key === product.slug,
		);
		assert.ok(source, `Missing provenance: ${product.slug}`);
		assert.equal(source.categorySlug, product.categorySlug);
		const documented = new Set(
			source.images.flatMap((image) => [
				image.path,
				...("publicUrl" in image ? [image.publicUrl] : []),
			]),
		);
		assert.ok(
			[
				...product.images,
				...(product.optionMedia ?? []).flatMap((media) => media.images),
			].includes(product.imageUrl),
		);
		for (const url of new Set([
			product.imageUrl,
			...product.images,
			...(product.optionMedia ?? []).flatMap((media) => media.images),
		])) {
			assert.ok(
				documented.has(url),
				`Undocumented image: ${product.slug}`,
			);
			assert.ok(!url.includes("unsplash"));
			assert.ok(
				!imageOwners.has(url),
				`Image shared by ${product.slug} and ${imageOwners.get(url)}`,
			);
			imageOwners.set(url, product.slug);
		}
		assert.equal(product.unitsSold, 0);
		assert.equal(product.reviewCount, 0);
		assert.equal(product.rating, 0);
		assert.equal(product.reviews?.length ?? 0, 0);
	}
});

test("every seeded SKU has complete unique attributes and a matching option gallery", () => {
	assert.equal(
		STORE_PRODUCTS.reduce((sum, product) => sum + product.stockQuantity, 0),
		156,
		"Adding options must not manufacture inventory",
	);
	for (const product of STORE_PRODUCTS) {
		const variants = product.variants ?? [];
		assert.ok(variants.length, `${product.slug}: missing configurations`);
		const axes = Object.keys(variants[0].attributes).sort();
		const signatures = new Set<string>();
		for (const variant of variants) {
			assert.deepEqual(
				Object.keys(variant.attributes).sort(),
				axes,
				product.slug,
			);
			const signature = JSON.stringify(
				axes.map((axis) => [axis, variant.attributes[axis]]),
			);
			assert.ok(
				!signatures.has(signature),
				`${product.slug}: duplicate option combination`,
			);
			signatures.add(signature);
			const gallery = resolveOptionGallery(product, variant.attributes);
			assert.ok(gallery.length, `${variant.sku}: missing photo`);
			for (const media of product.optionMedia ?? []) {
				if (variant.attributes[media.axis] !== media.value) {
					assert.ok(
						media.images.every((url) => !gallery.includes(url)),
						`${variant.sku}: another option's photo leaked`,
					);
				}
			}
		}
	}
});

test("manufacturer constraints prevent unsupported storage, memory and color combinations", () => {
	const variants = (slug: string) =>
		STORE_PRODUCTS.find((product) => product.slug === slug)?.variants ?? [];
	assert.equal(
		new Set(variants("iphone-18-pro").map((v) => v.attributes.colour)).size,
		4,
	);
	assert.equal(
		new Set(variants("jbl-charge-6").map((v) => v.attributes.colour)).size,
		10,
	);
	assert.ok(
		variants("galaxy-buds4").every((v) =>
			["Black", "White"].includes(v.attributes.colour),
		),
	);
	for (const { attributes: a } of variants("ipad-pro-m5")) {
		const highCapacity = ["1 TB", "2 TB"].includes(a.storage);
		assert.equal(a.memory, highCapacity ? "16 GB" : "12 GB");
		if (!highCapacity) {
			assert.ok(!JSON.stringify(a).toLowerCase().includes("nano"));
		}
	}
	assert.deepEqual(
		variants("apple-tv-4k").map((v) => [
			v.attributes.storage,
			v.attributes.connectivity,
		]),
		[
			["64 GB", "Wi-Fi"],
			["128 GB", "Wi-Fi + Ethernet"],
		],
	);
});
