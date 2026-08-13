import { ProductRowActions } from "@admin/components/products/ProductRowActions";
import { formatMoney } from "@commerce/lib/money";
import { getAdminStoreProducts } from "@repo/database";
import { Button } from "@repo/ui/components/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@repo/ui/components/table";
import { PackageOpenIcon, PlusIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default async function AdminProductsPage() {
	const products = await getAdminStoreProducts();

	return (
		<div>
			<div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
				<div>
					<p className="font-semibold text-primary text-sm">
						Catalogue
					</p>
					<h1 className="mt-1 font-semibold text-2xl">
						Products and stock
					</h1>
					<p className="mt-1 text-muted-foreground text-sm">
						Publish products, adjust stock, and keep customer-facing
						details current.
					</p>
				</div>
				<Button asChild>
					<Link href="/admin/products/new">
						<PlusIcon className="size-4" /> Add product
					</Link>
				</Button>
			</div>

			{products.length === 0 ? (
				<div className="mt-6 flex min-h-72 flex-col items-center justify-center rounded-2xl bg-muted/55 p-6 text-center">
					<PackageOpenIcon className="size-7 text-muted-foreground" />
					<h2 className="mt-4 font-semibold text-xl">
						No products yet
					</h2>
					<p className="mt-2 text-muted-foreground text-sm">
						Add the first product to begin building the catalogue.
					</p>
					<Button asChild className="mt-5" size="sm">
						<Link href="/admin/products/new">Add product</Link>
					</Button>
				</div>
			) : (
				<div className="mt-6 overflow-hidden rounded-2xl border bg-card">
					<div className="overflow-x-auto">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Product</TableHead>
									<TableHead>Category</TableHead>
									<TableHead>Price</TableHead>
									<TableHead className="text-right">
										Status and stock
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{products.map((product) => (
									<TableRow key={product.id}>
										<TableCell>
											<div className="flex min-w-64 items-center gap-3">
												<div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-muted">
													{product.images[0] && (
														<Image
															src={
																product
																	.images[0]
																	.url
															}
															alt=""
															fill
															sizes="48px"
															className="object-cover"
														/>
													)}
												</div>
												<div>
													<Link
														href={`/admin/products/${product.id}`}
														className="font-medium hover:text-primary"
													>
														{product.name}
													</Link>
													<p className="mt-1 text-muted-foreground text-xs">
														{product.brand} ·{" "}
														{product.sku}
													</p>
												</div>
											</div>
										</TableCell>
										<TableCell className="text-muted-foreground text-sm">
											{product.category.name}
										</TableCell>
										<TableCell className="font-medium tabular-nums">
											{formatMoney(
												product.priceInPesewas,
											)}
										</TableCell>
										<TableCell>
											<ProductRowActions
												productId={product.id}
												status={product.status}
												stockQuantity={
													product.stockQuantity
												}
											/>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>
				</div>
			)}
		</div>
	);
}
