"use client";

import {
	bulkUpdateStoreProductStatusAction,
	updateStoreProductStatusAction,
	updateStoreProductStockAction,
} from "@admin/actions/commerce";
import { ADMIN_TD, ADMIN_TH } from "@admin/components/AdminPage";
import { ProductRowActions } from "@admin/components/products/ProductRowActions";
import { AddProductButton } from "@admin/components/products/ProductSheet";
import {
	FacetField,
	ResultCount,
	SearchField,
	SortButton,
	TablePagination,
	TableToolbar,
} from "@admin/components/TableControls";
import {
	AdminButton,
	AdminCheckbox,
	AdminInput,
	AdminSelect,
} from "@admin/components/ui";
import { type PRODUCT_SORTS, productListParsers } from "@admin/lib/list-params";
import { formatRelativeTime } from "@admin/lib/overview";
import {
	conditionLabel,
	formatMoney,
	type StoreProductCondition,
} from "@repo/commerce";
import { cn } from "@repo/ui";
import { toastError, toastSuccess } from "@repo/ui/components/toast";
import { XIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { debounce, useQueryStates } from "nuqs";
import { useState, useTransition } from "react";

export type ProductStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";

export type StockState = "OUT" | "LOW" | "OK";

type ProductSort = (typeof PRODUCT_SORTS)[number];

export interface ProductRow {
	id: string;
	name: string;
	slug: string;
	brand: string;
	sku: string;
	imageUrl: string | null;
	categoryName: string;
	priceInPesewas: number;
	compareAtInPesewas: number | null;
	stockQuantity: number;
	lowStockThreshold: number;
	status: ProductStatus;
	condition: StoreProductCondition;
	isFeatured: boolean;
	updatedAt: string;
	stockState: StockState;
}

export interface ProductsTableFacets {
	status: Partial<Record<ProductStatus, number>>;
	stock: Record<StockState, number>;
	categories: Array<{ id: string; name: string; count: number }>;
}

const STATUS_LABELS: Record<ProductStatus, string> = {
	ACTIVE: "Active",
	DRAFT: "Draft",
	ARCHIVED: "Archived",
};

const STOCK_LABELS: Record<StockState, string> = {
	OUT: "Out of stock",
	LOW: "Low stock",
	OK: "In stock",
};

const BULK_STATUSES: ProductStatus[] = ["ACTIVE", "DRAFT", "ARCHIVED"];

const MONO = "font-mono tabular-nums";

/** Typing should not put a request on the wire per keystroke. */
const SEARCH_DEBOUNCE = debounce(400);

export function ProductsTable({
	products,
	facets,
	total,
	page,
	pageCount,
}: {
	products: ProductRow[];
	facets: ProductsTableFacets;
	total: number;
	page: number;
	pageCount: number;
}) {
	const router = useRouter();
	const [isNavigating, startNavigation] = useTransition();
	const [isBulkPending, startBulk] = useTransition();
	const [selected, setSelected] = useState<string[]>([]);

	const [params, setParams] = useQueryStates(productListParsers, {
		// The database does the filtering, so every change has to reach the
		// server component rather than stopping at the client router.
		shallow: false,
		startTransition: startNavigation,
	});

	const selectedOnPage = selected.filter((id) =>
		products.some((product) => product.id === id),
	);
	const allOnPageSelected =
		products.length > 0 && selectedOnPage.length === products.length;

	function toggleAllOnPage(checked: boolean) {
		const idsOnPage = products.map((product) => product.id);
		setSelected(
			checked
				? [...new Set([...selected, ...idsOnPage])]
				: selected.filter((id) => !idsOnPage.includes(id)),
		);
	}

	function toggleOne(id: string, checked: boolean) {
		setSelected(
			checked
				? [...selected, id]
				: selected.filter((item) => item !== id),
		);
	}

	function sortBy(sort: ProductSort) {
		// Clicking the column already sorted flips it; a new column starts
		// descending, which is what "most recent" and "most expensive" mean.
		const dir =
			params.sort === sort && params.dir === "desc" ? "asc" : "desc";
		void setParams({ sort, dir, page: 1 });
	}

	function applyBulkStatus(status: ProductStatus) {
		startBulk(async () => {
			const result = await bulkUpdateStoreProductStatusAction(
				selectedOnPage,
				status,
			);
			if (result.success) {
				toastSuccess(result.message);
				setSelected([]);
				router.refresh();
			} else {
				toastError(result.message);
			}
		});
	}

	const hasFilters = Boolean(
		params.q.trim() || params.status || params.stock || params.dept,
	);

	function clearFilters() {
		void setParams({
			q: "",
			status: null,
			stock: null,
			dept: null,
			page: 1,
		});
	}

	const columns: Array<{
		key: string;
		label: string;
		sort?: ProductSort;
		alignRight?: boolean;
	}> = [
		{ key: "name", label: "Product", sort: "name" },
		{ key: "department", label: "Department" },
		{ key: "price", label: "Price", sort: "price", alignRight: true },
		{ key: "stock", label: "Stock", sort: "stock", alignRight: true },
		{ key: "updated", label: "Updated", sort: "updated", alignRight: true },
		{ key: "status", label: "Status", alignRight: true },
	];

	return (
		<div>
			<TableToolbar isPending={isNavigating}>
				<SearchField
					label="Search products"
					placeholder="Search by name, brand, SKU or department"
					value={params.q}
					isPending={isNavigating}
					onChange={(value) =>
						void setParams(
							{ q: value, page: 1 },
							{ limitUrlUpdates: SEARCH_DEBOUNCE },
						)
					}
				/>

				<FacetField
					label="Status"
					value={params.status ?? ""}
					onChange={(value) =>
						void setParams({
							status: (value || null) as ProductStatus | null,
							page: 1,
						})
					}
					options={BULK_STATUSES.map((value) => ({
						value,
						label: STATUS_LABELS[value],
						count: facets.status[value] ?? 0,
					}))}
				/>

				<FacetField
					label="Stock"
					value={params.stock ?? ""}
					onChange={(value) =>
						void setParams({
							stock: (value || null) as StockState | null,
							page: 1,
						})
					}
					options={(["OUT", "LOW", "OK"] as StockState[]).map(
						(value) => ({
							value,
							label: STOCK_LABELS[value],
							count: facets.stock[value],
						}),
					)}
				/>

				<FacetField
					label="Department"
					value={params.dept ?? ""}
					onChange={(value) =>
						void setParams({ dept: value || null, page: 1 })
					}
					options={facets.categories.map((category) => ({
						value: category.id,
						label: category.name,
						count: category.count,
					}))}
				/>

				<ResultCount
					shown={products.length}
					total={total}
					noun="products"
					onClear={hasFilters ? clearFilters : undefined}
				/>
			</TableToolbar>

			{/*
			 * The bulk bar takes the place of the column heads rather than
			 * floating over the rows, so nothing is ever hidden behind it.
			 */}
			{selectedOnPage.length > 0 && (
				<div className="flex flex-wrap items-center gap-x-4 gap-y-2.5 border-border border-b bg-muted px-3 py-2.5">
					<p className="font-medium text-[13px] text-foreground tabular-nums">
						{selectedOnPage.length} selected
					</p>
					<div className="flex flex-wrap items-center gap-2">
						{BULK_STATUSES.map((status) => (
							<AdminButton
								key={status}
								size="sm"
								disabled={isBulkPending}
								onClick={() => applyBulkStatus(status)}
								className="bg-background"
							>
								{STATUS_LABELS[status]}
							</AdminButton>
						))}
					</div>
					<button
						type="button"
						onClick={() => setSelected([])}
						className="ml-auto inline-flex items-center gap-1.5 text-[12.5px] text-muted-foreground hover:text-foreground"
					>
						<XIcon className="size-3.5" />
						Clear selection
					</button>
				</div>
			)}

			<div
				className={cn(
					"overflow-x-auto transition-opacity",
					isNavigating && "opacity-60",
				)}
			>
				<table className="w-full border-collapse text-left">
					<thead>
						<tr>
							<th className={ADMIN_TH}>
								<AdminCheckbox
									aria-label="Select every product on this page"
									checked={allOnPageSelected}
									ref={(node: HTMLInputElement | null) => {
										if (node) {
											node.indeterminate =
												selectedOnPage.length > 0 &&
												!allOnPageSelected;
										}
									}}
									onChange={(event) =>
										toggleAllOnPage(event.target.checked)
									}
								/>
							</th>
							{columns.map((column) => (
								<th
									key={column.key}
									className={cn(
										ADMIN_TH,
										column.alignRight && "text-right",
									)}
								>
									{column.sort ? (
										<SortButton
											active={params.sort === column.sort}
											dir={params.dir}
											alignRight={column.alignRight}
											onToggle={() =>
												column.sort &&
												sortBy(column.sort)
											}
										>
											{column.label}
										</SortButton>
									) : (
										column.label
									)}
								</th>
							))}
							<th className={cn(ADMIN_TH, "text-right")}>
								<span className="sr-only">Actions</span>
							</th>
						</tr>
					</thead>
					<tbody>
						{products.map((product) => {
							const isSelected = selected.includes(product.id);
							return (
								<tr
									key={product.id}
									className={cn(
										"transition-colors",
										isSelected && "bg-muted",
									)}
								>
									<td
										className={cn(
											ADMIN_TD,
											// Sold out carries an ink edge
											// rather than a coloured row, so a
											// screen of them stays readable.
											product.stockState === "OUT" &&
												"border-l-2 border-l-foreground",
										)}
									>
										<AdminCheckbox
											aria-label={`Select ${product.name}`}
											checked={isSelected}
											onChange={(event) =>
												toggleOne(
													product.id,
													event.target.checked,
												)
											}
										/>
									</td>
									<td className={ADMIN_TD}>
										<div className="flex min-w-[260px] items-center gap-3.5">
											<span className="relative size-10 shrink-0 overflow-hidden rounded-[2px] bg-muted">
												{product.imageUrl && (
													<Image
														src={product.imageUrl}
														alt=""
														fill
														sizes="40px"
														className="object-cover"
													/>
												)}
											</span>
											<span className="min-w-0">
												<Link
													href={`/admin/products/${product.id}`}
													className="block truncate font-medium text-[13px] text-foreground transition-colors hover:text-[var(--ed-accent)]"
												>
													{product.name}
												</Link>
												<span className="mt-1 block truncate text-[12px] text-muted-foreground">
													{product.brand} ·{" "}
													<span className={MONO}>
														{product.sku}
													</span>
													{product.isFeatured && (
														<span className="ml-2 font-medium text-[var(--ed-accent)]">
															Featured
														</span>
													)}
													{product.condition !==
														"NEW" && (
														<span className="ml-2">
															{conditionLabel(
																product.condition,
															)}
														</span>
													)}
												</span>
											</span>
										</div>
									</td>
									<td className={ADMIN_TD}>
										<span className="block min-w-[120px] text-[13px] text-muted-foreground">
											{product.categoryName}
										</span>
									</td>
									<td className={ADMIN_TD}>
										<div className="min-w-[96px] text-right">
											<span
												className={cn(
													"block font-medium text-[13px] text-foreground",
													MONO,
												)}
											>
												{formatMoney(
													product.priceInPesewas,
												)}
											</span>
											{product.compareAtInPesewas ? (
												<span
													className={cn(
														"mt-1 block text-[12px] text-muted-foreground line-through",
														MONO,
													)}
												>
													{formatMoney(
														product.compareAtInPesewas,
													)}
												</span>
											) : null}
										</div>
									</td>
									<td className={ADMIN_TD}>
										<StockCell
											key={product.stockQuantity}
											product={product}
										/>
									</td>
									<td className={ADMIN_TD}>
										<span className="block min-w-[90px] text-right text-[12.5px] text-muted-foreground">
											{formatRelativeTime(
												new Date(product.updatedAt),
												new Date(),
											)}
										</span>
									</td>
									<td className={ADMIN_TD}>
										<div className="flex justify-end">
											<StatusCell product={product} />
										</div>
									</td>
									<td className={ADMIN_TD}>
										<div className="flex justify-end">
											<ProductRowActions
												product={product}
											/>
										</div>
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>

			{products.length === 0 && (
				<div className="py-14 text-center">
					<p className="text-[13.5px] text-muted-foreground">
						{hasFilters
							? "No products match those filters."
							: "No products yet."}
					</p>
					<div className="mt-5 flex justify-center">
						{hasFilters ? (
							<AdminButton size="sm" onClick={clearFilters}>
								Clear filters
							</AdminButton>
						) : (
							<AddProductButton />
						)}
					</div>
				</div>
			)}

			<TablePagination
				page={page}
				pageCount={pageCount}
				isPending={isNavigating}
				onPage={(next) => void setParams({ page: next })}
			/>
		</div>
	);
}

/**
 * Stock is edited in place because it is the field that changes most often and
 * almost never alone — a delivery arrives and eight rows move. Opening the
 * editor for each of them was the slowest thing about this screen.
 *
 * It saves on blur, or on Enter. The cell is keyed on the server's value by
 * its caller, so a refresh that genuinely changes the number resets the input
 * instead of leaving a stale one behind.
 */
function StockCell({ product }: { product: ProductRow }) {
	const router = useRouter();
	const [value, setValue] = useState(product.stockQuantity);
	const [isSaving, setIsSaving] = useState(false);

	async function save() {
		if (value === product.stockQuantity || isSaving) {
			return;
		}

		setIsSaving(true);
		const result = await updateStoreProductStockAction(product.id, value);
		setIsSaving(false);

		if (result.success) {
			toastSuccess("Stock updated");
			router.refresh();
		} else {
			setValue(product.stockQuantity);
			toastError("Stock not updated", result.message);
		}
	}

	return (
		<div className="flex min-w-[104px] flex-col items-end gap-1">
			<AdminInput
				type="number"
				min="0"
				inputSize="sm"
				value={value}
				disabled={isSaving}
				onChange={(event) => setValue(Number(event.target.value))}
				onBlur={save}
				onKeyDown={(event) => {
					if (event.key === "Enter") {
						event.preventDefault();
						event.currentTarget.blur();
					}
					if (event.key === "Escape") {
						setValue(product.stockQuantity);
					}
				}}
				aria-label={`Stock for ${product.name}`}
				className="w-[76px] text-right"
			/>
			{product.stockState !== "OK" && (
				<span
					className={cn(
						"text-[11.5px]",
						product.stockState === "OUT"
							? "font-medium text-foreground"
							: "text-[var(--ed-accent)]",
					)}
				>
					{STOCK_LABELS[product.stockState]}
				</span>
			)}
		</div>
	);
}

function StatusCell({ product }: { product: ProductRow }) {
	const router = useRouter();
	const [isSaving, setIsSaving] = useState(false);

	async function change(next: string) {
		setIsSaving(true);
		const result = await updateStoreProductStatusAction(
			product.id,
			next as ProductStatus,
		);
		setIsSaving(false);

		if (result.success) {
			toastSuccess("Status updated");
			router.refresh();
		} else {
			toastError("Status not updated", result.message);
		}
	}

	return (
		<AdminSelect
			size="sm"
			value={product.status}
			disabled={isSaving}
			onValueChange={change}
			aria-label={`Status for ${product.name}`}
			className="w-auto min-w-[116px]"
			options={BULK_STATUSES.map((value) => ({
				value,
				label: STATUS_LABELS[value],
			}))}
		/>
	);
}
