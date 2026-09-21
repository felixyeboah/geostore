import {
	EMPTY_PRODUCT,
	ProductForm,
} from "@admin/components/products/ProductForm";
import { getStoreCategories } from "@repo/database";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Add product" };

/**
 * Adding a product is a page of its own again — the form is too big for a
 * drawer once it carries options, per-colour photos and a live preview.
 * The old `?new=true` sheet address redirects here (see next.config.ts).
 */
export default async function NewProductPage() {
	const categories = await getStoreCategories({ includeInactive: true });

	return (
		<ProductForm
			categories={categories.map(({ id, name }) => ({ id, name }))}
			defaultValues={EMPTY_PRODUCT}
		/>
	);
}
