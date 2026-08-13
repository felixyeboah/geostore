import { ProductForm } from "@admin/components/products/ProductForm";
import type { ProductFormValues } from "@repo/api/modules/commerce/types";
import { getAdminStoreProductById, getStoreCategories } from "@repo/database";
import { notFound } from "next/navigation";

interface EditProductPageProps {
	params: Promise<{ id: string }>;
}

function parseSpecifications(value: unknown): Record<string, string> {
	if (!value || typeof value !== "object" || Array.isArray(value)) {
		return {};
	}
	return Object.fromEntries(
		Object.entries(value).filter(
			(entry): entry is [string, string] => typeof entry[1] === "string",
		),
	);
}

export default async function EditProductPage({
	params,
}: EditProductPageProps) {
	const { id } = await params;
	const [product, categories] = await Promise.all([
		getAdminStoreProductById(id),
		getStoreCategories({ includeInactive: true }),
	]);
	if (!product) {
		notFound();
	}

	const defaultValues: ProductFormValues = {
		name: product.name,
		slug: product.slug,
		shortDescription: product.shortDescription ?? "",
		description: product.description,
		brand: product.brand,
		sku: product.sku,
		status: product.status,
		priceInPesewas: product.priceInPesewas,
		compareAtInPesewas: product.compareAtInPesewas ?? undefined,
		stockQuantity: product.stockQuantity,
		lowStockThreshold: product.lowStockThreshold,
		isFeatured: product.isFeatured,
		categoryId: product.categoryId,
		imageUrls: product.images.map((image) => image.url),
		specifications: parseSpecifications(product.specifications),
	};

	return (
		<ProductForm
			productId={product.id}
			categories={categories.map(({ id: categoryId, name }) => ({
				id: categoryId,
				name,
			}))}
			defaultValues={defaultValues}
		/>
	);
}
