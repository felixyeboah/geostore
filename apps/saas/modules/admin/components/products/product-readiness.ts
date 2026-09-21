import type { ProductFormValues } from "@repo/api/modules/commerce/types";
import { isColourAxis, optionValueHex, variantAxes } from "@repo/commerce";

/** Whether the product sells as one item or as a set of combinations. */
export type SoldAs = "single" | "options";

export interface ReadinessRule {
	id: string;
	label: string;
	/** The section the "fix" link jumps to. */
	anchor: string;
	ok: boolean;
	/** A short count shown beside the label — "3", "5/6". */
	detail?: string;
}

/**
 * The plain-English checklist beside the form: what still stands between this
 * product and the storefront. The first four mirror `productFormSchema`, so
 * a red tick here is the same thing a failed save would report; the last two
 * are stricter than the schema because a live combination with no stock is
 * technically valid and practically a broken shop.
 */
export function productReadiness(
	values: ProductFormValues,
	soldAs: SoldAs,
): ReadinessRule[] {
	const active = values.variants.filter((variant) => variant.isActive);
	const rules: ReadinessRule[] = [
		{
			id: "basics",
			label: "Name, brand and department",
			anchor: "#basics",
			ok:
				values.name.trim().length >= 2 &&
				values.brand.trim().length >= 2 &&
				values.categoryId !== "",
		},
		{
			id: "copy",
			label: "Summary and description",
			anchor: "#basics",
			ok:
				values.shortDescription.trim().length >= 10 &&
				values.shortDescription.length <= 180 &&
				values.description.trim().length >= 30,
		},
		{
			id: "photo",
			label: "At least one photo",
			anchor: "#photos",
			ok: values.imageUrls.length > 0,
			detail: values.imageUrls.length
				? String(values.imageUrls.length)
				: "",
		},
		{
			id: "price",
			label: soldAs === "options" ? "Starting price" : "Price",
			anchor: "#selling",
			ok: values.priceInPesewas > 0,
		},
	];

	if (soldAs === "single") {
		rules.push({
			id: "stock",
			label: "Stock count entered",
			anchor: "#selling",
			ok:
				Number.isInteger(values.stockQuantity) &&
				values.stockQuantity >= 0,
			detail: String(values.stockQuantity),
		});
		return rules;
	}

	rules.push({
		id: "options",
		label: "At least one option with choices",
		anchor: "#selling",
		ok: values.variants.length > 0,
	});
	// Stock is deliberately not part of this: a sold-out colour on a live
	// product is normal, and the shop shows it as out of stock.
	const complete = active.filter((variant) => variant.priceInPesewas > 0);
	rules.push({
		id: "combos",
		label: "Every combination on sale has a price",
		anchor: "#selling",
		ok: active.length > 0 && complete.length === active.length,
		detail: values.variants.length
			? `${complete.length}/${values.variants.length}`
			: "",
	});

	const colourAxis = variantAxes(values.variants).find((axis) =>
		isColourAxis(axis.key),
	);
	if (colourAxis) {
		// A named colour ("White") has a built-in swatch; anything else needs
		// a hex from the admin.
		const hasSwatch = (value: string) =>
			Boolean(optionValueHex(values.optionMedia, colourAxis.key, value));
		rules.push({
			id: "swatch",
			label: `Every ${colourAxis.label.toLowerCase()} has a swatch`,
			anchor: "#selling",
			ok: colourAxis.values.every(hasSwatch),
		});
	}

	return rules;
}

export function isReadyToPublish(
	values: ProductFormValues,
	soldAs: SoldAs,
): boolean {
	return productReadiness(values, soldAs).every((rule) => rule.ok);
}
