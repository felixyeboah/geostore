"use client";

import { bulkUpdateStoreOrderStatusAction } from "@admin/actions/commerce";
import { ADMIN_TD, ADMIN_TH } from "@admin/components/AdminPage";
import { OrderStatusSelect } from "@admin/components/orders/OrderStatusSelect";
import {
	AdminButton,
	AdminCheckbox,
	AdminInput,
	AdminSelect,
} from "@admin/components/ui";
import {
	formatRelativeTime,
	ORDER_STATUS_LABELS,
	type OrderStatusKey,
} from "@admin/lib/overview";
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
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

export interface OrderRow {
	id: string;
	orderNumber: string;
	placedAt: string;
	customerName: string;
	customerEmail: string;
	customerPhone: string;
	destination: string;
	itemCount: number;
	totalInPesewas: number;
	paymentMethod: string;
	paymentStatus: string;
	status: OrderStatusKey;
	/** Paid, unshipped and past the promised dispatch window. */
	isLate: boolean;
}

/** Bulk moves an admin can reach for; the destructive ones stay per-order. */
const BULK_STATUSES: OrderStatusKey[] = [
	"CONFIRMED",
	"PROCESSING",
	"READY_FOR_DELIVERY",
	"OUT_FOR_DELIVERY",
	"DELIVERED",
];

const MONO = "font-mono tabular-nums";

export function OrdersTable({ orders }: { orders: OrderRow[] }) {
	const router = useRouter();
	const [sorting, setSorting] = useState<SortingState>([
		{ id: "placedAt", desc: true },
	]);
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
	const [globalFilter, setGlobalFilter] = useState("");
	const [rowSelection, setRowSelection] = useState({});
	const [isPending, startTransition] = useTransition();

	const columns = useMemo<ColumnDef<OrderRow>[]>(
		() => [
			{
				id: "select",
				header: ({ table }) => (
					<AdminCheckbox
						aria-label="Select every order on this page"
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
						aria-label={`Select order ${row.original.orderNumber}`}
						checked={row.getIsSelected()}
						onChange={row.getToggleSelectedHandler()}
					/>
				),
				enableSorting: false,
				size: 32,
			},
			{
				accessorKey: "orderNumber",
				header: "Order",
				cell: ({ row }) => (
					<div className="min-w-[160px]">
						<span
							className={cn(
								"block font-medium text-[13px] text-foreground",
								MONO,
							)}
						>
							{row.original.orderNumber}
						</span>
						<span className="mt-1 block text-[12px] text-muted-foreground">
							{row.original.itemCount}{" "}
							{row.original.itemCount === 1 ? "item" : "items"}
							{row.original.isLate && (
								<span className="ml-2 font-medium text-[var(--ed-accent)]">
									Late
								</span>
							)}
						</span>
					</div>
				),
			},
			{
				accessorKey: "customerName",
				header: "Customer",
				cell: ({ row }) => (
					<div className="min-w-[180px]">
						<span className="block truncate text-[13px] text-foreground">
							{row.original.customerName}
						</span>
						<span className="mt-1 block truncate text-[12px] text-muted-foreground">
							{row.original.destination}
						</span>
					</div>
				),
			},
			{
				accessorKey: "paymentStatus",
				header: "Payment",
				filterFn: "equalsString",
				cell: ({ row }) => (
					<div className="min-w-[110px]">
						<span
							className={cn(
								"text-[13px]",
								row.original.paymentStatus === "PAID"
									? "text-foreground"
									: "text-[var(--ed-accent)]",
							)}
						>
							{titleCase(row.original.paymentStatus)}
						</span>
						<span className="mt-1 block text-[12px] text-muted-foreground">
							{titleCase(row.original.paymentMethod)}
						</span>
					</div>
				),
			},
			{
				accessorKey: "totalInPesewas",
				header: "Total",
				cell: ({ row }) => (
					<span
						className={cn(
							"block text-right font-medium text-[13px] text-foreground",
							MONO,
						)}
					>
						{formatMoney(row.original.totalInPesewas)}
					</span>
				),
			},
			{
				accessorKey: "placedAt",
				header: "Placed",
				cell: ({ row }) => {
					const placed = new Date(row.original.placedAt);
					return (
						<div className="min-w-[110px] text-right">
							<span
								className={cn(
									"block text-[13px] text-foreground",
									MONO,
								)}
							>
								{new Intl.DateTimeFormat("en-GH", {
									hour: "2-digit",
									minute: "2-digit",
								}).format(placed)}
							</span>
							<span className="mt-1 block text-[12px] text-muted-foreground">
								{formatRelativeTime(placed, new Date())}
							</span>
						</div>
					);
				},
			},
			{
				accessorKey: "status",
				header: "Fulfilment",
				filterFn: "equalsString",
				cell: ({ row }) => (
					<div className="flex justify-end">
						<OrderStatusSelect
							orderId={row.original.id}
							status={row.original.status}
							paymentStatus={row.original.paymentStatus}
							paymentMethod={row.original.paymentMethod}
						/>
					</div>
				),
				enableSorting: false,
			},
		],
		[],
	);

	const table = useReactTable({
		data: orders,
		columns,
		state: { sorting, columnFilters, globalFilter, rowSelection },
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		onGlobalFilterChange: setGlobalFilter,
		onRowSelectionChange: setRowSelection,
		getRowId: (row) => row.id,
		globalFilterFn: (row, _columnId, value) => {
			const needle = String(value).toLowerCase();
			const order = row.original;
			return [
				order.orderNumber,
				order.customerName,
				order.customerEmail,
				order.customerPhone,
				order.destination,
			].some((field) => field.toLowerCase().includes(needle));
		},
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getFacetedRowModel: getFacetedRowModel(),
		getFacetedUniqueValues: getFacetedUniqueValues(),
		initialState: { pagination: { pageSize: 25 } },
	});

	const selectedIds = table
		.getSelectedRowModel()
		.rows.map((row) => row.original.id);

	function applyBulkStatus(status: OrderStatusKey) {
		startTransition(async () => {
			const result = await bulkUpdateStoreOrderStatusAction(
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
	const paymentFacets = table
		.getColumn("paymentStatus")
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
					<span className="sr-only">Search orders</span>
					<AdminInput
						type="search"
						value={globalFilter}
						onChange={(event) =>
							setGlobalFilter(event.target.value)
						}
						placeholder="Search by order number, customer, phone or town"
						className="h-10 pl-9"
					/>
				</label>

				<FacetSelect
					label="Fulfilment"
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
					options={Object.entries(ORDER_STATUS_LABELS).map(
						([value, label]) => ({
							value,
							label,
							count: statusFacets?.get(value) ?? 0,
						}),
					)}
				/>

				<FacetSelect
					label="Payment"
					value={
						(table.getColumn("paymentStatus")?.getFilterValue() as
							| string
							| undefined) ?? ""
					}
					onChange={(value) =>
						table
							.getColumn("paymentStatus")
							?.setFilterValue(value || undefined)
					}
					options={[...(paymentFacets?.entries() ?? [])]
						.sort(([left], [right]) => left.localeCompare(right))
						.map(([value, count]) => ({
							value,
							label: titleCase(value),
							count,
						}))}
				/>

				<p className="ml-auto shrink-0 text-[12.5px] text-muted-foreground tabular-nums">
					{table.getFilteredRowModel().rows.length} of {orders.length}
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
								{ORDER_STATUS_LABELS[status]}
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
									const alignRight = [
										"totalInPesewas",
										"placedAt",
										"status",
									].includes(header.column.id);
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
											// A late order carries an ink edge
											// rather than a coloured row, so a
											// screen of them stays readable.
											cell.column.id === "select" &&
												row.original.isLate &&
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
				<p className="py-14 text-center text-[13.5px] text-muted-foreground">
					No orders match those filters.
				</p>
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

function titleCase(value: string): string {
	return value
		.toLocaleLowerCase()
		.replace(/_/g, " ")
		.replace(/^./, (character) => character.toLocaleUpperCase());
}
