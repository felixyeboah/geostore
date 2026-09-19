import {
	ADMIN_TABLE,
	ADMIN_TD,
	ADMIN_TH,
	AdminEmptyState,
	AdminHeader,
} from "@admin/components/AdminPage";
import { ProductRowActions } from "@admin/components/products/ProductRowActions";
import { adminButtonClass } from "@admin/components/ui";
import { formatMoney } from "@repo/commerce";
import { getAdminStoreProducts } from "@repo/database";
import { PlusIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default async function AdminProductsPage() {
	const products = await getAdminStoreProducts();

	return (
		<div>
			<AdminHeader
				eyebrow="Catalogue"
				title="Products and stock"
				description="Publish products, adjust stock, and keep customer-facing details current."
				actions={
					<Link
						href="/admin/products/new"
						className={adminButtonClass("primary")}
					>
						<PlusIcon className="size-4" />
						Add product
					</Link>
				}
			/>

			{products.length === 0 ? (
				<AdminEmptyState
					title="No products yet"
					description="Add the first product to begin building the catalogue."
					action={
						<Link
							href="/admin/products/new"
							className={adminButtonClass("primary")}
						>
							Add product
						</Link>
					}
				/>
			) : (
				<div className="mt-9 overflow-x-auto">
					<table className={ADMIN_TABLE}>
						<thead>
							<tr>
								<th className={ADMIN_TH}>Product</th>
								<th className={ADMIN_TH}>Department</th>
								<th className={ADMIN_TH}>Price</th>
								<th className={`${ADMIN_TH} text-right`}>
									Status and stock
								</th>
							</tr>
						</thead>
						<tbody>
							{products.map((product) => (
								<tr key={product.id}>
									<td className={ADMIN_TD}>
										<div className="flex min-w-64 items-center gap-3.5">
											<span className="relative size-11 shrink-0 overflow-hidden rounded-[2px] bg-muted">
												{product.images[0] && (
													<Image
														src={
															product.images[0]
																.url
														}
														alt=""
														fill
														sizes="44px"
														className="object-cover"
													/>
												)}
											</span>
											<span className="min-w-0">
												<Link
													href={`/admin/products/${product.id}`}
													className="block truncate font-medium text-foreground hover:text-[var(--ed-accent)]"
												>
													{product.name}
												</Link>
												<span className="mt-1 block truncate text-[12px] text-muted-foreground">
													{product.brand} ·{" "}
													{product.sku}
												</span>
											</span>
										</div>
									</td>
									<td
										className={`${ADMIN_TD} text-muted-foreground`}
									>
										{product.category.name}
									</td>
									<td
										className={`${ADMIN_TD} font-medium tabular-nums`}
									>
										{formatMoney(product.priceInPesewas)}
									</td>
									<td className={ADMIN_TD}>
										<ProductRowActions
											productId={product.id}
											status={product.status}
											stockQuantity={
												product.stockQuantity
											}
										/>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</div>
	);
}
