"use client";

import { bulkUpdateStoreOrderStatusAction } from "@admin/actions/commerce";
import { ADMIN_TD, ADMIN_TH } from "@admin/components/AdminPage";
import { OrderSheet } from "@admin/components/orders/OrderSheet";
import { OrderStatusSelect } from "@admin/components/orders/OrderStatusSelect";
import {
	FacetField,
	ResultCount,
	SearchField,
	SortButton,
	TablePagination,
	TableToolbar,
} from "@admin/components/TableControls";
import { AdminButton, AdminCheckbox } from "@admin/components/ui";
import { type ORDER_SORTS, orderListParsers } from "@admin/lib/list-params";
import {
	formatRelativeTime,
	ORDER_STATUS_LABELS,
	type OrderStatusKey,
	PAYMENT_METHOD_LABELS,
} from "@admin/lib/overview";
import { formatMoney } from "@repo/commerce";
import { cn } from "@repo/ui";
import { toastError, toastSuccess } from "@repo/ui/components/toast";
import { XIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { debounce, useQueryStates } from "nuqs";
import { useState, useTransition } from "react";

type OrderSort = (typeof ORDER_SORTS)[number];

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

export interface OrdersTableFacets {
	status: Partial<Record<OrderStatusKey, number>>;
	payment: Partial<Record<string, number>>;
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

const SEARCH_DEBOUNCE = debounce(400);

export function OrdersTable({
	orders,
	facets,
	total,
	page,
	pageCount,
}: {
	orders: OrderRow[];
	facets: OrdersTableFacets;
	total: number;
	page: number;
	pageCount: number;
}) {
	const router = useRouter();
	const [isNavigating, startNavigation] = useTransition();
	const [isBulkPending, startBulk] = useTransition();
	const [selected, setSelected] = useState<string[]>([]);
	const [sheetOrder, setSheetOrder] = useState<{
		id: string;
		orderNumber: string;
	} | null>(null);

	const [params, setParams] = useQueryStates(orderListParsers, {
		shallow: false,
		startTransition: startNavigation,
	});

	const selectedOnPage = selected.filter((id) =>
		orders.some((order) => order.id === id),
	);
	const allOnPageSelected =
		orders.length > 0 && selectedOnPage.length === orders.length;

	function toggleAllOnPage(checked: boolean) {
		const idsOnPage = orders.map((order) => order.id);
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

	function sortBy(sort: OrderSort) {
		const dir =
			params.sort === sort && params.dir === "desc" ? "asc" : "desc";
		void setParams({ sort, dir, page: 1 });
	}

	function applyBulkStatus(status: OrderStatusKey) {
		startBulk(async () => {
			const result = await bulkUpdateStoreOrderStatusAction(
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
		params.q.trim() || params.status || params.payment,
	);

	function clearFilters() {
		void setParams({ q: "", status: null, payment: null, page: 1 });
	}

	const paymentValues = [
		...new Set([
			...Object.keys(facets.payment),
			...(params.payment ? [params.payment] : []),
		]),
	].sort();

	return (
		<div>
			<TableToolbar isPending={isNavigating}>
				<SearchField
					label="Search orders"
					placeholder="Search by order number, customer, email or phone"
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
					label="Fulfilment"
					value={params.status ?? ""}
					onChange={(value) =>
						void setParams({
							status: orderListParsers.status.parse(value),
							page: 1,
						})
					}
					options={Object.entries(ORDER_STATUS_LABELS).map(
						([value, label]) => ({
							value,
							label,
							count: facets.status[value as OrderStatusKey] ?? 0,
						}),
					)}
				/>

				<FacetField
					label="Payment"
					value={params.payment ?? ""}
					onChange={(value) =>
						void setParams({
							payment: orderListParsers.payment.parse(value),
							page: 1,
						})
					}
					options={paymentValues.map((value) => ({
						value,
						label: paymentMethodLabel(value),
						count: facets.payment[value] ?? 0,
					}))}
				/>

				<ResultCount
					shown={orders.length}
					total={total}
					noun="orders"
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
								{ORDER_STATUS_LABELS[status]}
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
									aria-label="Select every order on this page"
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
							<th className={ADMIN_TH}>Order</th>
							<th className={ADMIN_TH}>
								<SortButton
									active={params.sort === "customer"}
									dir={params.dir}
									onToggle={() => sortBy("customer")}
								>
									Customer
								</SortButton>
							</th>
							<th className={ADMIN_TH}>Payment</th>
							<th className={cn(ADMIN_TH, "text-right")}>
								<SortButton
									active={params.sort === "total"}
									dir={params.dir}
									alignRight
									onToggle={() => sortBy("total")}
								>
									Total
								</SortButton>
							</th>
							<th className={cn(ADMIN_TH, "text-right")}>
								<SortButton
									active={params.sort === "placed"}
									dir={params.dir}
									alignRight
									onToggle={() => sortBy("placed")}
								>
									Placed
								</SortButton>
							</th>
							<th className={cn(ADMIN_TH, "text-right")}>
								Fulfilment
							</th>
						</tr>
					</thead>
					<tbody>
						{orders.map((order) => {
							const isSelected = selected.includes(order.id);
							const placed = new Date(order.placedAt);
							return (
								<tr
									key={order.id}
									className={cn(
										"cursor-pointer transition-colors hover:bg-muted/60",
										isSelected && "bg-muted",
									)}
									onClick={(event) => {
										// Checkbox, status control and the mark-paid
										// button own their clicks — everything else
										// opens the order sheet.
										if (
											(
												event.target as HTMLElement
											).closest(
												"button, input, select, a, [role='combobox'], [role='option']",
											)
										) {
											return;
										}
										setSheetOrder({
											id: order.id,
											orderNumber: order.orderNumber,
										});
									}}
								>
									<td
										className={cn(
											ADMIN_TD,
											// A late order carries an ink edge
											// rather than a coloured row, so a
											// screen of them stays readable.
											order.isLate &&
												"border-l-2 border-l-foreground",
										)}
									>
										<AdminCheckbox
											aria-label={`Select order ${order.orderNumber}`}
											checked={isSelected}
											onChange={(event) =>
												toggleOne(
													order.id,
													event.target.checked,
												)
											}
										/>
									</td>
									<td className={ADMIN_TD}>
										<div className="min-w-[160px]">
											<span
												className={cn(
													"block font-medium text-[13px] text-foreground",
													MONO,
												)}
											>
												{order.orderNumber}
											</span>
											<span className="mt-1 block text-[12px] text-muted-foreground">
												{order.itemCount}{" "}
												{order.itemCount === 1
													? "item"
													: "items"}
												{order.isLate && (
													<span className="ml-2 font-medium text-[var(--ed-accent)]">
														Late
													</span>
												)}
											</span>
										</div>
									</td>
									<td className={ADMIN_TD}>
										<div className="min-w-[180px]">
											<span className="block truncate text-[13px] text-foreground">
												{order.customerName}
											</span>
											<span className="mt-1 block truncate text-[12px] text-muted-foreground">
												{order.destination}
											</span>
										</div>
									</td>
									<td className={ADMIN_TD}>
										<div className="min-w-[110px]">
											<span
												className={cn(
													"text-[13px]",
													order.paymentStatus ===
														"PAID"
														? "text-foreground"
														: "text-[var(--ed-accent)]",
												)}
											>
												{titleCase(order.paymentStatus)}
											</span>
											<span className="mt-1 block text-[12px] text-muted-foreground">
												{paymentMethodLabel(
													order.paymentMethod,
												)}
											</span>
										</div>
									</td>
									<td className={ADMIN_TD}>
										<span
											className={cn(
												"block text-right font-medium text-[13px] text-foreground",
												MONO,
											)}
										>
											{formatMoney(order.totalInPesewas)}
										</span>
									</td>
									<td className={ADMIN_TD}>
										<div className="min-w-[110px] text-right">
											<span
												className={cn(
													"block text-[13px] text-foreground",
													MONO,
												)}
											>
												{new Intl.DateTimeFormat(
													"en-GH",
													{
														hour: "2-digit",
														minute: "2-digit",
													},
												).format(placed)}
											</span>
											<span className="mt-1 block text-[12px] text-muted-foreground">
												{formatRelativeTime(
													placed,
													new Date(),
												)}
											</span>
										</div>
									</td>
									<td className={ADMIN_TD}>
										<div className="flex justify-end">
											<OrderStatusSelect
												orderId={order.id}
												status={order.status}
												paymentStatus={
													order.paymentStatus
												}
												paymentMethod={
													order.paymentMethod
												}
											/>
										</div>
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>

			{orders.length === 0 && (
				<div className="py-14 text-center">
					<p className="text-[13.5px] text-muted-foreground">
						{hasFilters
							? "No orders match those filters."
							: "No orders yet."}
					</p>
					{hasFilters && (
						<div className="mt-5 flex justify-center">
							<AdminButton size="sm" onClick={clearFilters}>
								Clear filters
							</AdminButton>
						</div>
					)}
				</div>
			)}

			<TablePagination
				page={page}
				pageCount={pageCount}
				isPending={isNavigating}
				onPage={(next) => void setParams({ page: next })}
			/>

			<OrderSheet
				orderId={sheetOrder?.id ?? null}
				orderNumber={sheetOrder?.orderNumber ?? null}
				onClose={() => setSheetOrder(null)}
			/>
		</div>
	);
}

function titleCase(value: string): string {
	return value
		.toLocaleLowerCase()
		.replace(/_/g, " ")
		.replace(/^./, (character) => character.toLocaleUpperCase());
}

// "WHATSAPP" title-cases to "Whatsapp" — the label map knows the real casing.
function paymentMethodLabel(value: string): string {
	return (
		PAYMENT_METHOD_LABELS[value as keyof typeof PAYMENT_METHOD_LABELS] ??
		titleCase(value)
	);
}
