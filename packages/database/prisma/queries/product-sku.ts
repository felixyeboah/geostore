import { randomUUID } from "node:crypto";

function skuSegment(value: string): string {
	return value
		.normalize("NFKD")
		.replace(/[\u0300-\u036f]/g, "")
		.toUpperCase()
		.replace(/[^A-Z0-9]+/g, "-")
		.replace(/^-|-$/g, "")
		.slice(0, 32)
		.replace(/-$/g, "");
}

/** Generated once on the server, then preserved as the inventory identifier. */
export function newProductSku(name: string): string {
	return `GST-${skuSegment(name) || "PRODUCT"}-${randomUUID().replace(/-/g, "").toUpperCase()}`;
}

export function newVariantSku(parentSku: string, attributes: unknown): string {
	const values =
		attributes &&
		typeof attributes === "object" &&
		!Array.isArray(attributes)
			? Object.entries(attributes)
					.sort(([a], [b]) => a.localeCompare(b))
					.flatMap(([, value]) =>
						typeof value === "string" ? [skuSegment(value)] : [],
					)
					.filter(Boolean)
			: [];
	return [
		parentSku,
		...values,
		randomUUID().replace(/-/g, "").toUpperCase(),
	].join("-");
}
