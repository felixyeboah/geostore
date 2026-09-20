import { AdminHeader } from "@admin/components/AdminPage";
import {
	type PaymentMethod,
	type PaymentStatus,
	type TransactionRow,
	TransactionsTable,
} from "@admin/components/transactions/TransactionsTable";
import { loadTransactionListParams } from "@admin/lib/list-params";
import { formatMoney } from "@repo/commerce";
import {
	getAdminTransactionList,
	getAdminTransactionSummary,
} from "@repo/database";
import { ArrowRightIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import type { SearchParams } from "nuqs/server";

export const metadata: Metadata = { title: "Transactions" };

export default async function AdminTransactionsPage({
	searchParams,
}: {
	searchParams: Promise<SearchParams>;
}) {
	const params = await loadTransactionListParams(searchParams);

	const [list, summary] = await Promise.all([
		getAdminTransactionList({
			q: params.q,
			status: (params.status as PaymentStatus | null) ?? undefined,
			method: (params.method as PaymentMethod | null) ?? undefined,
			sort: params.sort,
			dir: params.dir,
			page: params.page,
		}),
		getAdminTransactionSummary(),
	]);

	const rows: TransactionRow[] = list.transactions.map((transaction) => ({
		id: transaction.id,
		reference: transaction.reference,
		provider: transaction.provider,
		providerPaymentId: transaction.providerPaymentId,
		status: transaction.status as PaymentStatus,
		method: transaction.paymentMethod as PaymentMethod,
		amountInPesewas: transaction.amountInPesewas,
		createdAt: transaction.createdAt.toISOString(),
		processedAt: transaction.processedAt?.toISOString() ?? null,
		orderId: transaction.order.id,
		orderNumber: transaction.order.orderNumber,
		customerEmail: transaction.order.customerEmail,
	}));

	const hasLedger = summary.settledCount > 0 || list.total > 0;

	// The position of the book, in the order an accountant reads it: what came
	// in, what went back out, and what is left.
	const position = [
		{
			key: "settled",
			label: "Settled",
			value: formatMoney(summary.settledInPesewas),
			detail: `${summary.settledCount} ${summary.settledCount === 1 ? "payment" : "payments"}`,
			urgent: false,
		},
		{
			key: "refunded",
			label: "Refunded",
			value:
				summary.refundedInPesewas > 0
					? `−${formatMoney(summary.refundedInPesewas)}`
					: formatMoney(0),
			detail: `${summary.refundedCount} returned`,
			urgent: summary.refundedCount > 0,
		},
		{
			key: "net",
			label: "Net taken",
			value: formatMoney(summary.netInPesewas),
			detail: "Settled less refunds",
			urgent: false,
		},
		{
			key: "unsettled",
			label: "Not settled",
			value: String(summary.failedCount + summary.pendingCount),
			detail: `${summary.failedCount} failed · ${summary.pendingCount} pending`,
			urgent: summary.failedCount > 0,
		},
	];

	return (
		<div>
			<AdminHeader
				eyebrow="Payments"
				title="Transactions"
				description={
					hasLedger
						? "Every payment attempt against an order — settled, refunded, failed or still pending."
						: "Paid checkouts and refunds appear here, each one tied to the order it belongs to."
				}
				actions={
					<Link
						href="/admin/orders"
						className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
					>
						Orders
						<ArrowRightIcon className="size-3.5" />
					</Link>
				}
			/>

			{hasLedger ? (
				<>
					<section className="mt-9 grid gap-x-10 gap-y-7 border-border border-b pb-7 sm:grid-cols-2 lg:grid-cols-4">
						{position.map((item) => (
							<div key={item.key}>
								<p className="eyebrow text-muted-foreground">
									{item.label}
								</p>
								<p
									className={
										item.urgent
											? "mt-3 font-semibold text-[22px] text-[var(--ed-accent)] tabular-nums tracking-[-0.02em]"
											: "mt-3 font-semibold text-[22px] text-foreground tabular-nums tracking-[-0.02em]"
									}
								>
									{item.value}
								</p>
								<p className="mt-1.5 text-[12px] text-muted-foreground">
									{item.detail}
								</p>
							</div>
						))}
					</section>

					<div className="mt-2">
						<TransactionsTable
							transactions={rows}
							facets={list.facets}
							total={list.total}
							page={list.page}
							pageCount={list.pageCount}
						/>
					</div>
				</>
			) : (
				<div className="mt-9 py-16 text-center">
					<p className="font-medium text-[15px] text-foreground">
						No payments yet
					</p>
					<p className="mx-auto mt-2 max-w-sm text-[13.5px] text-muted-foreground">
						Each attempt against an order is recorded here with its
						provider reference, so a figure on a statement can be
						traced back to the order that produced it.
					</p>
				</div>
			)}
		</div>
	);
}
