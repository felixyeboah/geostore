import type { ProductFormValues } from "@repo/api/modules/commerce/types";
import { defaultVariantSelection, variantAxes } from "@repo/commerce";

/** Start like the storefront, while retaining options the admin chose to inspect. */
export function previewVariantSelection(
	variants: ProductFormValues["variants"],
	picks: Record<string, string>,
): Record<string, string> {
	const defaults = defaultVariantSelection(
		variants
			.filter((variant) => variant.isActive)
			.map((variant) => ({ ...variant, id: variant.id ?? "" })),
	);
	return Object.fromEntries(
		variantAxes(variants).map((axis) => {
			const chosen = picks[axis.key];
			const fallback = Object.entries(defaults)
				.find(
					([key]) =>
						key.trim().toLowerCase() === axis.key.toLowerCase(),
				)?.[1]
				.trim();
			return [
				axis.key,
				chosen && axis.values.includes(chosen)
					? chosen
					: (fallback ?? axis.values[0]),
			];
		}),
	);
}
