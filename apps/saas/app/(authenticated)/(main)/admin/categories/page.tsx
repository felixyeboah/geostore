import { AdminHeader } from "@admin/components/AdminPage";
import {
	CategoriesList,
	type CategoryRow,
} from "@admin/components/categories/CategoriesList";
import {
	AddCategoryButton,
	CategorySheet,
} from "@admin/components/categories/CategorySheet";
import { getStoreCategories } from "@repo/database";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Departments" };

export default async function AdminCategoriesPage() {
	const categories = await getStoreCategories({ includeInactive: true });

	const rows: CategoryRow[] = categories.map((category) => ({
		id: category.id,
		name: category.name,
		slug: category.slug,
		description: category.description,
		imageUrl: category.imageUrl,
		isActive: category.isActive,
		sortOrder: category.sortOrder,
		productCount: category._count.products,
	}));

	const hidden = rows.filter((row) => !row.isActive);
	const empty = rows.filter((row) => row.productCount === 0);

	// Reads as a sentence, so the shape of the catalogue is legible before
	// anyone reads a row.
	const headline = [
		hidden.length ? `${hidden.length} hidden` : null,
		empty.length ? `${empty.length} with no products` : null,
	].filter(Boolean);

	return (
		<div>
			<AdminHeader
				eyebrow="Catalogue"
				title="Departments"
				description={
					rows.length === 0
						? "The top level of the shop. Every product belongs to one."
						: headline.length > 0
							? `${rows.length} departments · ${headline.join(" · ")}.`
							: `${rows.length} departments, all visible and stocked.`
				}
				actions={rows.length > 0 ? <AddCategoryButton /> : undefined}
			/>

			<CategoriesList categories={rows} />

			{rows.length > 0 && (
				<p className="mt-4 text-[12px] text-muted-foreground">
					The order here is the order customers see on /shop and in
					the menu.
				</p>
			)}

			<CategorySheet categories={rows} />
		</div>
	);
}
