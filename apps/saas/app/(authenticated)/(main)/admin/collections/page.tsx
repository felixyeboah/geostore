import { AdminHeader } from "@admin/components/AdminPage";
import {
	AddCollectionButton,
	CollectionSheet,
} from "@admin/components/collections/CollectionSheet";
import {
	type CollectionRow,
	CollectionsList,
} from "@admin/components/collections/CollectionsList";
import { SMART_COLLECTIONS } from "@repo/commerce";
import { getAdminStoreCollections } from "@repo/database";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Collections" };

export default async function AdminCollectionsPage() {
	const collections = await getAdminStoreCollections();

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
		productIds: collection.products.map((entry) => entry.productId),
	}));

	const hidden = rows.filter((row) => !row.isActive);
	const empty = rows.filter((row) => row.productCount === 0);
	const onLanding = rows.filter((row) => row.onLanding && row.isActive);

	const headline = [
		hidden.length ? `${hidden.length} hidden` : null,
		empty.length ? `${empty.length} empty` : null,
		onLanding.length ? `${onLanding.length} on the landing page` : null,
	].filter(Boolean);

	return (
		<div>
			<AdminHeader
				eyebrow="Catalogue"
				title="Collections"
				description={
					rows.length === 0
						? "Groups that cut across departments — what a product is for, rather than what it is."
						: headline.length > 0
							? `${rows.length} collections · ${headline.join(" · ")}.`
							: `${rows.length} collections, all visible and stocked.`
				}
				actions={rows.length > 0 ? <AddCollectionButton /> : undefined}
			/>

			<CollectionsList collections={rows} />

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

			<CollectionSheet collections={rows} />
		</div>
	);
}
