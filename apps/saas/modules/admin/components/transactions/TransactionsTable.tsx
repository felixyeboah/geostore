"use client";

import { ADMIN_TD, ADMIN_TH } from "@admin/components/AdminPage";
import {
	FacetField,
	ResultCount,
	SearchField,
	SortButton,
	TablePagination,
	TableToolbar,
} from "@admin/components/TableControls";
import { AdminButton } from "@admin/components/ui";
import {
	PAYMENT_METHODS,
	PAYMENT_STATUSES,
	transactionListParsers,
} from "@admin/lib/list-params";
import { formatRelativeTime } from "@admin/lib/overview";
import { formatMoney } from "@repo/commerce";
import { cn } from "@repo/ui";
import Link from "next/link";
import { debounce, useQueryStates } from "nuqs";
import { useTransition } from "react";

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export interface TransactionRow {
	id: string;
	reference: string;
	provider: string;
	providerPaymentId: string | null;
	status: PaymentStatus;
	method: PaymentMethod;
	amountInPesewas: number;
	createdAt: string;
	processedAt: string | null;
	orderId: string;
	orderNumber: string;
	customerEmail: string;
}

export interface TransactionsFacets {
	status: Partial<Record<PaymentStatus, number>>;
	method: Partial<Record<PaymentMethod, number>>;
}

const STATUS_LABELS: Record<PaymentStatus, string> = {
	PAID: "Paid",
	PENDING: "Pending",
	FAILED: "Failed",
	REFUNDED: "Refunded",
};

const METHOD_LABELS: Record<PaymentMethod, string> = {
	MOCK: "Mock",
	ONLINE: "Online",
	CARD: "Card",
	MOBILE_MONEY: "Mobile money",
	CASH_ON_DELIVERY: "Cash on delivery",
};

const MONO = "font-mono tabular-nums";

const SEARCH_DEBOUNCE = debounce(400);

export function TransactionsTable({
	transactions,
	facets,
	total,
	page,
	pageCount,
}: {
	transactions: TransactionRow[];
	facets: TransactionsFacets;
	total: number;
	page: number;
	pageCount: number;
}) {
	const [isNavigating, startNavigation] = useTransition();
	const [params, setParams] = useQueryStates(transactionListParsers, {
		shallow: false,
		startTransition: startNavigation,
	});

	function sortBy(
		sort: (typeof transactionListParsers.sort)["defaultValue"],
	) {
		const dir =
			params.sort === sort && params.dir === "desc" ? "asc" : "desc";
		void setParams({ sort, dir, page: 1 });
	}

	const hasFilters = Boolean(
		params.q.trim() || params.status || params.method,
	);

	function clearFilters() {
		void setParams({ q: "", status: null, method: null, page: 1 });
	}

	return (
		<div>
			<TableToolbar isPending={isNavigating}>
				<SearchField
					label="Search transactions"
					placeholder="Search by reference, order number or customer"
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
							status: (value || null) as PaymentStatus | null,
							page: 1,
						})
					}
					options={PAYMENT_STATUSES.map((value) => ({
						value,
						label: STATUS_LABELS[value],
						count: facets.status[value] ?? 0,
					}))}
				/>

				<FacetField
					label="Method"
					value={params.method ?? ""}
					onChange={(value) =>
						void setParams({
							method: (value || null) as PaymentMethod | null,
							page: 1,
						})
					}
					options={PAYMENT_METHODS.map((value) => ({
						value,
						label: METHOD_LABELS[value],
						count: facets.method[value] ?? 0,
					}))}
				/>

				<ResultCount
					shown={transactions.length}
					total={total}
					noun="payments"
					onClear={hasFilters ? clearFilters : undefined}
				/>
			</TableToolbar>

			<div
				className={cn(
					"overflow-x-auto transition-opacity",
					isNavigating && "opacity-60",
				)}
			>
				<table className="w-full border-collapse text-left">
					<thead>
						<tr>
							<th className={ADMIN_TH}>Reference</th>
							<th className={ADMIN_TH}>Order</th>
							<th className={ADMIN_TH}>Method</th>
							<th className={ADMIN_TH}>Status</th>
							<th className={cn(ADMIN_TH, "text-right")}>
								<SortButton
									active={params.sort === "created"}
									dir={params.dir}
									alignRight
									onToggle={() => sortBy("created")}
								>
									Taken
								</SortButton>
							</th>
							<th className={cn(ADMIN_TH, "text-right")}>
								<SortButton
									active={params.sort === "amount"}
									dir={params.dir}
									alignRight
									onToggle={() => sortBy("amount")}
								>
									Amount
								</SortButton>
							</th>
						</tr>
					</thead>
					<tbody>
						{transactions.map((transaction) => {
							const isRefund = transaction.status === "REFUNDED";
							const failed = transaction.status === "FAILED";
							return (
								<tr key={transaction.id}>
									<td
										className={cn(
											ADMIN_TD,
											// A refund is money leaving, and a
											// failure is money that never
											// arrived. Both are marked at the
											// row's edge rather than by
											// colouring the whole line.
											isRefund &&
												"border-l-2 border-l-[var(--ed-accent)]",
											failed &&
												"border-l-2 border-l-foreground",
										)}
									>
										<span
											className={cn(
												"block max-w-[22ch] truncate text-[12.5px] text-foreground",
												MONO,
											)}
											title={transaction.reference}
										>
											{transaction.reference}
										</span>
										<span className="mt-1 block text-[12px] text-muted-foreground capitalize">
											{transaction.provider}
										</span>
									</td>
									<td className={ADMIN_TD}>
										<div className="min-w-[150px]">
											<Link
												href={`/admin/orders?q=${encodeURIComponent(transaction.orderNumber)}`}
												className={cn(
													"block font-medium text-[13px] text-foreground transition-colors hover:text-[var(--ed-accent)]",
													MONO,
												)}
											>
												{transaction.orderNumber}
											</Link>
											<span className="mt-1 block max-w-[24ch] truncate text-[12px] text-muted-foreground">
												{transaction.customerEmail}
											</span>
										</div>
									</td>
									<td className={ADMIN_TD}>
										<span className="block min-w-[110px] text-[13px] text-muted-foreground">
											{METHOD_LABELS[transaction.method]}
										</span>
									</td>
									<td className={ADMIN_TD}>
										<span
											className={cn(
												"text-[13px]",
												transaction.status === "PAID"
													? "text-foreground"
													: "text-[var(--ed-accent)]",
											)}
										>
											{STATUS_LABELS[transaction.status]}
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
														day: "numeric",
														month: "short",
													},
												).format(
													new Date(
														transaction.createdAt,
													),
												)}
											</span>
											<span className="mt-1 block text-[12px] text-muted-foreground">
												{formatRelativeTime(
													new Date(
														transaction.createdAt,
													),
													new Date(),
												)}
											</span>
										</div>
									</td>
									<td className={ADMIN_TD}>
										<span
											className={cn(
												"block text-right font-medium text-[13px] tabular-nums",
												isRefund
													? "text-[var(--ed-accent)]"
													: failed
														? "text-muted-foreground line-through"
														: "text-foreground",
											)}
										>
											{isRefund ? "−" : ""}
											{formatMoney(
												transaction.amountInPesewas,
											)}
										</span>
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>

			{transactions.length === 0 && (
				<div className="py-14 text-center">
					<p className="text-[13.5px] text-muted-foreground">
						{hasFilters
							? "No payments match those filters."
							: "No payments yet."}
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
		</div>
	);
}
