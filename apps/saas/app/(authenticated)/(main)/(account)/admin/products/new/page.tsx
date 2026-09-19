import { ProductForm } from "@admin/components/products/ProductForm";
import type { ProductFormValues } from "@repo/api/modules/commerce/types";
import { getStoreCategories } from "@repo/database";

const DEFAULT_VALUES: ProductFormValues = {
	name: "",
	slug: "",
	shortDescription: "",
	description: "",
	brand: "",
	sku: "",
	status: "DRAFT",
	priceInPesewas: 0,
	compareAtInPesewas: undefined,
	stockQuantity: 0,
	lowStockThreshold: 5,
	isFeatured: false,
	categoryId: "",
	imageUrls: [],
	specifications: {},
	variants: [],
};

export default async function NewProductPage() {
	const categories = await getStoreCategories({ includeInactive: true });
	return (
		<ProductForm
			categories={categories.map(({ id, name }) => ({ id, name }))}
			defaultValues={DEFAULT_VALUES}
		/>
	);
}
