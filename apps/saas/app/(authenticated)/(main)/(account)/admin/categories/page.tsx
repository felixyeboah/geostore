import { CategoryForm } from "@admin/components/categories/CategoryForm";
import { getStoreCategories } from "@repo/database";

export default async function AdminCategoriesPage() {
	const categories = await getStoreCategories({ includeInactive: true });

	return (
		<div className="space-y-8">
			<div>
				<p className="font-semibold text-primary text-sm">Catalogue</p>
				<h1 className="mt-1 font-semibold text-2xl">Categories</h1>
				<p className="mt-1 text-muted-foreground text-sm">
					Create and update the categories customers browse.
				</p>
			</div>
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
