import { AdminHeader } from "@admin/components/AdminPage";
import { CategoryForm } from "@admin/components/categories/CategoryForm";
import { getStoreCategories } from "@repo/database";

export default async function AdminCategoriesPage() {
	const categories = await getStoreCategories({ includeInactive: true });

	return (
		<div className="space-y-8">
			<AdminHeader
				eyebrow="Catalogue"
				title="Categories"
				description="Create and update the categories customers browse."
			/>
			<CategoryForm />
			<div className="space-y-4">
				{categories.map((category) => (
					<div key={category.id}>
						<p className="mb-2 font-medium text-sm">
							{category.name}{" "}
							<span className="text-muted-foreground">
								· {category._count.products} products
							</span>
						</p>
						<CategoryForm category={category} />
					</div>
				))}
			</div>
		</div>
	);
}
