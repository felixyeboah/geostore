import { AdminHeader } from "@admin/components/AdminPage";
import {
	CategoriesList,
	type CategoryRow,
} from "@admin/components/categories/CategoriesList";
import {
	AddCategoryButton,
	CategorySheet,
} from "@admin/components/categories/CategorySheet";
import { TaxonomyListControls } from "@admin/components/TaxonomyListControls";
import { loadTaxonomyListParams } from "@admin/lib/list-params";
import { getAdminCategoryList } from "@repo/database";
import type { Metadata } from "next";
import type { SearchParams } from "nuqs/server";

export const metadata: Metadata = { title: "Departments" };

export default async function AdminCategoriesPage({
	searchParams,
}: {
	searchParams: Promise<SearchParams>;
}) {
	const params = await loadTaxonomyListParams(searchParams);
	const result = await getAdminCategoryList(params);
	const categories = result.rows;

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

	return (
		<div>
			<AdminHeader
				eyebrow="Catalogue"
				title="Departments"
				description={`${result.total} departments matching the current view.`}
				actions={<AddCategoryButton />}
			/>

			<TaxonomyListControls
				total={result.total}
				shown={rows.length}
				page={result.page}
				pageCount={result.pageCount}
				noun="departments"
				canReorder={result.canReorder}
			>
				<CategoriesList
					categories={rows}
					page={result.page}
					pageCount={result.pageCount}
					canReorder={result.canReorder}
				/>
			</TaxonomyListControls>

			{rows.length > 0 && (
				<p className="mt-4 text-[12px] text-muted-foreground">
					The order here is the order customers see on /shop and in
					the menu.
				</p>
			)}

			<CategorySheet
				categories={rows}
				nextSortOrder={result.nextSortOrder}
			/>
		</div>
	);
}
