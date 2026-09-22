import { AdminHeader } from "@admin/components/AdminPage";
import {
	AddCollectionButton,
	CollectionSheet,
} from "@admin/components/collections/CollectionSheet";
import {
	type CollectionRow,
	CollectionsList,
} from "@admin/components/collections/CollectionsList";
import { TaxonomyListControls } from "@admin/components/TaxonomyListControls";
import { loadTaxonomyListParams } from "@admin/lib/list-params";
import { SMART_COLLECTIONS } from "@repo/commerce";
import { getAdminCollectionList } from "@repo/database";
import type { Metadata } from "next";
import type { SearchParams } from "nuqs/server";

export const metadata: Metadata = { title: "Collections" };

export default async function AdminCollectionsPage({
	searchParams,
}: {
	searchParams: Promise<SearchParams>;
}) {
	const params = await loadTaxonomyListParams(searchParams);
	const result = await getAdminCollectionList(params);
	const collections = result.rows;

	const rows: CollectionRow[] = collections.map((collection) => ({
		id: collection.id,
		name: collection.name,
		slug: collection.slug,
		description: collection.description,
		imageUrl: collection.imageUrl,
		isActive: collection.isActive,
		onLanding: collection.onLanding,
		sortOrder: collection.sortOrder,
		productCount: collection._count.products,
	}));

	return (
		<div>
			<AdminHeader
				eyebrow="Catalogue"
				title="Collections"
				description={`${result.total} collections matching the current view.`}
				actions={<AddCollectionButton />}
			/>

			<TaxonomyListControls
				total={result.total}
				shown={rows.length}
				page={result.page}
				pageCount={result.pageCount}
				noun="collections"
				canReorder={result.canReorder}
			>
				<CollectionsList
					collections={rows}
					page={result.page}
					pageCount={result.pageCount}
					canReorder={result.canReorder}
				/>
			</TaxonomyListControls>

			{/*
			 * Smart collections are rules in code, not rows, so they cannot be
			 * edited here. Listing them anyway is the point: without them this
			 * screen would imply the shop menu holds only what is above, and
			 * an admin would go looking for "Best sellers" to edit.
			 */}
			<section className="mt-12 border-border border-t pt-7">
				<h2 className="eyebrow text-muted-foreground">
					Automatic collections
				</h2>
				<p className="mt-2 max-w-xl text-[13.5px] text-muted-foreground">
					These pick their own products from a rule, so there is
					nothing to choose. They appear in the shop menu alongside
					the ones above. Changing them means changing the rule, in{" "}
					<span className="font-mono text-[12.5px]">
						packages/commerce/collections.ts
					</span>
					.
				</p>
				<ul className="mt-5 border-border border-t">
					{SMART_COLLECTIONS.map((collection) => (
						<li
							key={collection.slug}
							className="flex items-center gap-4 border-border border-b py-3.5"
						>
							<div className="min-w-0 flex-1">
								<span className="block font-medium text-[14px] text-foreground">
									{collection.name}
								</span>
								<span className="mt-0.5 block truncate text-[12px] text-muted-foreground">
									{collection.description}
								</span>
							</div>
							<span className="shrink-0 text-[12.5px] text-muted-foreground">
								{collection.rule === "best-selling"
									? "Ranked by units sold"
									: "Newest first"}
								, top {collection.limit}
							</span>
						</li>
					))}
				</ul>
			</section>

			<CollectionSheet
				collections={rows}
				nextSortOrder={result.nextSortOrder}
			/>
		</div>
	);
}
