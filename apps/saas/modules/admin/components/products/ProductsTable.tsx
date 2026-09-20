"use client";

import {
	bulkUpdateStoreProductStatusAction,
	updateStoreProductStatusAction,
	updateStoreProductStockAction,
} from "@admin/actions/commerce";
import { ADMIN_TD, ADMIN_TH } from "@admin/components/AdminPage";
import { AddProductButton } from "@admin/components/products/ProductSheet";
import {
	AdminButton,
	AdminCheckbox,
	AdminInput,
	AdminSelect,
} from "@admin/components/ui";
import { formatRelativeTime } from "@admin/lib/overview";
import { formatMoney } from "@repo/commerce";
import { cn } from "@repo/ui";
import { toastError, toastSuccess } from "@repo/ui/components/toast";
import {
	type ColumnDef,
	type ColumnFiltersState,
	flexRender,
	getCoreRowModel,
	getFacetedRowModel,
	getFacetedUniqueValues,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	type SortingState,
	useReactTable,
} from "@tanstack/react-table";
import { ArrowDownIcon, ArrowUpIcon, SearchIcon, XIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

export type ProductStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";

export type StockState = "OUT" | "LOW" | "OK";

export interface ProductRow {
	id: string;
	name: string;
	brand: string;
	sku: string;
	imageUrl: string | null;
	categoryName: string;
	priceInPesewas: number;
	compareAtInPesewas: number | null;
	stockQuantity: number;
	lowStockThreshold: number;
	status: ProductStatus;
	isFeatured: boolean;
	updatedAt: string;
	stockState: StockState;
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

const RIGHT_ALIGNED = [
	"priceInPesewas",
	"stockQuantity",
	"updatedAt",
	"status",
];

const MONO = "font-mono tabular-nums";

export function ProductsTable({ products }: { products: ProductRow[] }) {
	const router = useRouter();
	const [sorting, setSorting] = useState<SortingState>([
		{ id: "updatedAt", desc: true },
	]);
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
	const [globalFilter, setGlobalFilter] = useState("");
	const [rowSelection, setRowSelection] = useState({});
	const [isPending, startTransition] = useTransition();

	const columns = useMemo<ColumnDef<ProductRow>[]>(
		() => [
			{
				id: "select",
				header: ({ table }) => (
					<AdminCheckbox
						aria-label="Select every product on this page"
						checked={table.getIsAllPageRowsSelected()}
						ref={(node: HTMLInputElement | null) => {
							if (node) {
								node.indeterminate =
									table.getIsSomePageRowsSelected() &&
									!table.getIsAllPageRowsSelected();
							}
						}}
						onChange={table.getToggleAllPageRowsSelectedHandler()}
					/>
				),
				cell: ({ row }) => (
					<AdminCheckbox
						aria-label={`Select ${row.original.name}`}
						checked={row.getIsSelected()}
						onChange={row.getToggleSelectedHandler()}
					/>
				),
				enableSorting: false,
				size: 32,
			},
			{
				accessorKey: "name",
				header: "Product",
				cell: ({ row }) => (
					<div className="flex min-w-[260px] items-center gap-3.5">
						<span className="relative size-10 shrink-0 overflow-hidden rounded-[2px] bg-muted">
							{row.original.imageUrl && (
								<Image
									src={row.original.imageUrl}
									alt=""
									fill
									sizes="40px"
									className="object-cover"
								/>
							)}
						</span>
						<span className="min-w-0">
							<Link
								href={`/admin/products/${row.original.id}`}
								className="block truncate font-medium text-[13px] text-foreground transition-colors hover:text-[var(--ed-accent)]"
							>
								{row.original.name}
							</Link>
							<span className="mt-1 block truncate text-[12px] text-muted-foreground">
								{row.original.brand} ·{" "}
								<span className={MONO}>{row.original.sku}</span>
								{row.original.isFeatured && (
									<span className="ml-2 font-medium text-[var(--ed-accent)]">
										Featured
									</span>
								)}
							</span>
						</span>
					</div>
				),
			},
			{
				accessorKey: "categoryName",
				header: "Department",
				filterFn: "equalsString",
				cell: ({ row }) => (
					<span className="block min-w-[120px] text-[13px] text-muted-foreground">
						{row.original.categoryName}
					</span>
				),
			},
			{
				accessorKey: "priceInPesewas",
				header: "Price",
				cell: ({ row }) => (
					<div className="min-w-[96px] text-right">
						<span
							className={cn(
								"block font-medium text-[13px] text-foreground",
								MONO,
							)}
						>
							{formatMoney(row.original.priceInPesewas)}
						</span>
						{row.original.compareAtInPesewas ? (
							<span
								className={cn(
									"mt-1 block text-[12px] text-muted-foreground line-through",
									MONO,
								)}
							>
								{formatMoney(row.original.compareAtInPesewas)}
							</span>
						) : null}
					</div>
				),
			},
			{
				accessorKey: "stockQuantity",
				header: "Stock",
				cell: ({ row }) => (
					<StockCell
						key={row.original.stockQuantity}
						product={row.original}
					/>
				),
			},
			{
				// Hidden: it exists so the stock facet can filter and count
				// like any other column rather than through a second code path.
				id: "stockState",
				accessorFn: (row) => row.stockState,
				filterFn: "equalsString",
				enableSorting: false,
			},
			{
				accessorKey: "updatedAt",
				header: "Updated",
				cell: ({ row }) => (
					<span className="block min-w-[90px] text-right text-[12.5px] text-muted-foreground">
						{formatRelativeTime(
							new Date(row.original.updatedAt),
							new Date(),
						)}
					</span>
				),
			},
			{
				accessorKey: "status",
				header: "Status",
				filterFn: "equalsString",
				cell: ({ row }) => (
					<div className="flex justify-end">
						<StatusCell product={row.original} />
					</div>
				),
				enableSorting: false,
			},
		],
		[],
	);

	const table = useReactTable({
		data: products,
		columns,
		state: { sorting, columnFilters, globalFilter, rowSelection },
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		onGlobalFilterChange: setGlobalFilter,
		onRowSelectionChange: setRowSelection,
		getRowId: (row) => row.id,
		globalFilterFn: (row, _columnId, value) => {
			const needle = String(value).toLowerCase();
			const product = row.original;
			return [
				product.name,
				product.brand,
				product.sku,
				product.categoryName,
			].some((field) => field.toLowerCase().includes(needle));
		},
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getFacetedRowModel: getFacetedRowModel(),
		getFacetedUniqueValues: getFacetedUniqueValues(),
		initialState: {
			pagination: { pageSize: 25 },
			columnVisibility: { stockState: false },
		},
	});

	const selectedIds = table
		.getSelectedRowModel()
		.rows.map((row) => row.original.id);

	function applyBulkStatus(status: ProductStatus) {
		startTransition(async () => {
			const result = await bulkUpdateStoreProductStatusAction(
				selectedIds,
				status,
			);
			if (result.success) {
				toastSuccess(result.message);
				setRowSelection({});
				router.refresh();
			} else {
				toastError(result.message);
			}
		});
	}

	const statusFacets = table.getColumn("status")?.getFacetedUniqueValues() as
		| Map<string, number>
		| undefined;
	const departmentFacets = table
		.getColumn("categoryName")
		?.getFacetedUniqueValues() as Map<string, number> | undefined;
	const stockFacets = table
		.getColumn("stockState")
		?.getFacetedUniqueValues() as Map<string, number> | undefined;

	const hasFilters =
		columnFilters.length > 0 || globalFilter.trim().length > 0;

	return (
		<div>
			<div className="flex flex-wrap items-center gap-x-4 gap-y-3 border-border border-b py-3.5">
				<label className="relative min-w-[220px] flex-1">
					<SearchIcon
						aria-hidden="true"
						className="-translate-y-1/2 absolute top-1/2 left-3 size-3.5 text-muted-foreground"
					/>
					<span className="sr-only">Search products</span>
					<AdminInput
						type="search"
						value={globalFilter}
						onChange={(event) =>
							setGlobalFilter(event.target.value)
						}
						placeholder="Search by name, brand, SKU or department"
						className="h-10 pl-9"
					/>
				</label>

				<FacetSelect
					label="Status"
					value={
						(table.getColumn("status")?.getFilterValue() as
							| string
							| undefined) ?? ""
					}
					onChange={(value) =>
						table
							.getColumn("status")
							?.setFilterValue(value || undefined)
					}
					options={BULK_STATUSES.map((value) => ({
						value,
						label: STATUS_LABELS[value],
						count: statusFacets?.get(value) ?? 0,
					}))}
				/>

				<FacetSelect
					label="Stock"
					value={
						(table.getColumn("stockState")?.getFilterValue() as
							| string
							| undefined) ?? ""
					}
					onChange={(value) =>
						table
							.getColumn("stockState")
							?.setFilterValue(value || undefined)
					}
					options={(["OUT", "LOW", "OK"] as StockState[]).map(
						(value) => ({
							value,
							label: STOCK_LABELS[value],
							count: stockFacets?.get(value) ?? 0,
						}),
					)}
				/>

				<FacetSelect
					label="Department"
					value={
						(table.getColumn("categoryName")?.getFilterValue() as
							| string
							| undefined) ?? ""
					}
					onChange={(value) =>
						table
							.getColumn("categoryName")
							?.setFilterValue(value || undefined)
					}
					options={[...(departmentFacets?.entries() ?? [])]
						.sort(([left], [right]) => left.localeCompare(right))
						.map(([value, count]) => ({
							value,
							label: value,
							count,
						}))}
				/>

				<p className="ml-auto shrink-0 text-[12.5px] text-muted-foreground tabular-nums">
					{table.getFilteredRowModel().rows.length} of{" "}
					{products.length}
				</p>

				{hasFilters && (
					<button
						type="button"
						onClick={() => {
							setColumnFilters([]);
							setGlobalFilter("");
						}}
						className="shrink-0 border-border border-b pb-px text-[12.5px] text-foreground transition-colors hover:border-foreground"
					>
						Clear
					</button>
				)}
			</div>

			{/*
			 * The bulk bar takes the place of the column heads rather than
			 * floating over the rows, so nothing is ever hidden behind it.
			 */}
			{selectedIds.length > 0 && (
				<div className="flex flex-wrap items-center gap-x-4 gap-y-2.5 border-border border-b bg-muted px-3 py-2.5">
					<p className="font-medium text-[13px] text-foreground tabular-nums">
						{selectedIds.length} selected
					</p>
					<div className="flex flex-wrap items-center gap-2">
						{BULK_STATUSES.map((status) => (
							<AdminButton
								key={status}
								size="sm"
								disabled={isPending}
								onClick={() => applyBulkStatus(status)}
								className="bg-background"
							>
								{STATUS_LABELS[status]}
							</AdminButton>
						))}
					</div>
					<button
						type="button"
						onClick={() => setRowSelection({})}
						className="ml-auto inline-flex items-center gap-1.5 text-[12.5px] text-muted-foreground hover:text-foreground"
					>
						<XIcon className="size-3.5" />
						Clear selection
					</button>
				</div>
			)}

			<div className="overflow-x-auto">
				<table className="w-full border-collapse text-left">
					<thead>
						{table.getHeaderGroups().map((headerGroup) => (
							<tr key={headerGroup.id}>
								{headerGroup.headers.map((header) => {
									const canSort = header.column.getCanSort();
									const sorted = header.column.getIsSorted();
									const alignRight = RIGHT_ALIGNED.includes(
										header.column.id,
									);
									return (
										<th
											key={header.id}
											className={cn(
												ADMIN_TH,
												alignRight && "text-right",
											)}
										>
											{header.isPlaceholder ? null : canSort ? (
												<button
													type="button"
													onClick={header.column.getToggleSortingHandler()}
													className={cn(
														"inline-flex items-center gap-1 uppercase tracking-[inherit] transition-colors hover:text-foreground",
														alignRight &&
															"flex-row-reverse",
													)}
												>
													{flexRender(
														header.column.columnDef
															.header,
														header.getContext(),
													)}
													{sorted === "asc" && (
														<ArrowUpIcon className="size-3" />
													)}
													{sorted === "desc" && (
														<ArrowDownIcon className="size-3" />
													)}
												</button>
											) : (
												flexRender(
													header.column.columnDef
														.header,
													header.getContext(),
												)
											)}
										</th>
									);
								})}
							</tr>
						))}
					</thead>
					<tbody>
						{table.getRowModel().rows.map((row) => (
							<tr
								key={row.id}
								className={cn(
									"transition-colors",
									row.getIsSelected() && "bg-muted",
								)}
							>
								{row.getVisibleCells().map((cell) => (
									<td
										key={cell.id}
										className={cn(
											ADMIN_TD,
											// Sold out carries an ink edge
											// rather than a coloured row, so a
											// screen of them stays readable.
											cell.column.id === "select" &&
												row.original.stockState ===
													"OUT" &&
												"border-l-2 border-l-foreground",
										)}
									>
										{flexRender(
											cell.column.columnDef.cell,
											cell.getContext(),
										)}
									</td>
								))}
							</tr>
						))}
					</tbody>
				</table>
			</div>

			{table.getFilteredRowModel().rows.length === 0 && (
				<div className="py-14 text-center">
					<p className="text-[13.5px] text-muted-foreground">
						{products.length === 0
							? "No products yet."
							: "No products match those filters."}
					</p>
					{products.length === 0 && (
						<div className="mt-5 flex justify-center">
							<AddProductButton />
						</div>
					)}
				</div>
			)}

			<div className="flex flex-wrap items-center justify-between gap-4 border-border border-t py-4">
				<p className="text-[12.5px] text-muted-foreground tabular-nums">
					Page {table.getState().pagination.pageIndex + 1} of{" "}
					{Math.max(table.getPageCount(), 1)}
				</p>
				<div className="flex items-center gap-2">
					<AdminButton
						size="sm"
						onClick={() => table.previousPage()}
						disabled={!table.getCanPreviousPage()}
					>
						Previous
					</AdminButton>
					<AdminButton
						size="sm"
						onClick={() => table.nextPage()}
						disabled={!table.getCanNextPage()}
					>
						Next
					</AdminButton>
				</div>
			</div>
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

function FacetSelect({
	label,
	value,
	onChange,
	options,
}: {
	label: string;
	value: string;
	onChange: (value: string) => void;
	options: { value: string; label: string; count: number }[];
}) {
	const available = options.filter((option) => option.count > 0);

	return (
		<label className="flex shrink-0 items-center gap-2">
			<span className="eyebrow text-muted-foreground">{label}</span>
			<AdminSelect
				size="sm"
				value={value}
				onValueChange={onChange}
				aria-label={label}
				emptyLabel="All"
				className="w-auto min-w-[136px]"
				options={available.map((option) => ({
					value: option.value,
					label: `${option.label} (${option.count})`,
				}))}
			/>
		</label>
	);
}
