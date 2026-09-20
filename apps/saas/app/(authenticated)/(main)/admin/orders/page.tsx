import { AdminHeader } from "@admin/components/AdminPage";
import {
	type OrderRow,
	OrdersTable,
} from "@admin/components/orders/OrdersTable";
import { loadOrderListParams } from "@admin/lib/list-params";
import type { OrderStatusKey } from "@admin/lib/overview";
import { formatMoney } from "@repo/commerce";
import {
	getAdminOrderList,
	getAdminOrderSummary,
	getStoreSettings,
} from "@repo/database";
import { ArrowRightIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import type { SearchParams } from "nuqs/server";

export const metadata: Metadata = { title: "Orders" };

function getAddressLabel(value: unknown): string {
	if (!value || typeof value !== "object" || Array.isArray(value)) {
		return "Address unavailable";
	}
	const address = value as Record<string, unknown>;
	return (
		[address.city, address.region]
			.filter((part): part is string => typeof part === "string")
			.join(", ") || "Address unavailable"
	);
}

/** Paid, not yet on its way, and past the window we promise customers. */
function isLate(
	order: {
		paymentStatus: string;
		status: string;
		placedAt: Date;
	},
	dispatchWindowHours: number,
): boolean {
	if (order.paymentStatus !== "PAID") {
		return false;
	}
	if (
		["OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED", "REFUNDED"].includes(
			order.status,
		)
	) {
		return false;
	}
	const hoursWaiting =
		(Date.now() - order.placedAt.getTime()) / (1000 * 60 * 60);
	return hoursWaiting > dispatchWindowHours;
}

export default async function AdminOrdersPage({
	searchParams,
}: {
	searchParams: Promise<SearchParams>;
}) {
	const params = await loadOrderListParams(searchParams);
	const { dispatchWindowHours } = await getStoreSettings();

	const [list, summary] = await Promise.all([
		getAdminOrderList({
			q: params.q,
			status: (params.status as OrderStatusKey | null) ?? undefined,
			paymentStatus:
				(params.payment as
					| "PENDING"
					| "PAID"
					| "FAILED"
					| "REFUNDED"
					| null) ?? undefined,
			sort: params.sort,
			dir: params.dir,
			page: params.page,
		}),
		getAdminOrderSummary(dispatchWindowHours),
	]);

	const rows: OrderRow[] = list.orders.map((order) => ({
		id: order.id,
		orderNumber: order.orderNumber,
		placedAt: order.placedAt.toISOString(),
		customerName: order.user?.name ?? order.customerEmail.split("@")[0],
		customerEmail: order.customerEmail,
		customerPhone: order.customerPhone,
		destination: getAddressLabel(order.shippingAddress),
		itemCount: order.items.length,
		totalInPesewas: order.totalInPesewas,
		paymentMethod: order.paymentMethod,
		paymentStatus: order.paymentStatus,
		status: order.status as OrderStatusKey,
		isLate: isLate(order, dispatchWindowHours),
	}));

	// The headline reads as a sentence, so the state of the shop is legible
	// before anyone parses a table. It counts the whole order book rather than
	// the page below it, so narrowing the table never hides what is waiting.
	const headline = [
		summary.late
			? `${summary.late} past the ${dispatchWindowHours}-hour window`
			: null,
		summary.awaitingDispatch
			? `${summary.awaitingDispatch} awaiting dispatch`
			: null,
		summary.unpaid
			? `${formatMoney(summary.unpaidValueInPesewas)} unpaid`
			: null,
	].filter(Boolean);

	const triage = [
		{
			key: "late",
			count: summary.late,
			title: `Past the ${dispatchWindowHours}-hour dispatch window`,
			detail: "Paid, and the customer is still waiting",
			urgent: true,
		},
		{
			key: "dispatch",
			count: summary.awaitingDispatch,
			title: "Paid and awaiting dispatch",
			detail: "Ready to pack and send",
			urgent: false,
		},
		{
			key: "unpaid",
			count: summary.unpaid,
			title: "Waiting on payment",
			detail: `${formatMoney(summary.unpaidValueInPesewas)} not yet collected`,
			urgent: false,
		},
	].filter((item) => item.count > 0);

	return (
		<div>
			<AdminHeader
				eyebrow="Fulfilment"
				title="Orders"
				description={
					summary.total === 0
						? "Orders placed through checkout will appear here."
						: headline.length > 0
							? `${headline.join(" · ")}.`
							: "Nothing is waiting on you. Every paid order is on its way."
				}
				actions={
					<Link
						href="/admin/transactions"
						className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
					>
						Payments
						<ArrowRightIcon className="size-3.5" />
					</Link>
				}
			/>

			{triage.length > 0 && (
				<section className="mt-9 grid gap-x-10 gap-y-5 border-border border-b pb-6 sm:grid-cols-3">
					{triage.map((item) => (
						<div
							key={item.key}
							className="flex items-baseline gap-3.5"
						>
							<span
								className={
									item.urgent
										? "font-semibold text-[22px] text-[var(--ed-accent)] tabular-nums"
										: "font-semibold text-[22px] text-foreground tabular-nums"
								}
							>
								{item.count}
							</span>
							<span className="min-w-0">
								<span className="block font-medium text-[13.5px] text-foreground">
									{item.title}
								</span>
								<span className="mt-0.5 block text-[12px] text-muted-foreground">
									{item.detail}
								</span>
							</span>
						</div>
					))}
				</section>
			)}

			<div className={triage.length > 0 ? "mt-2" : "mt-9"}>
				<OrdersTable
					orders={rows}
					facets={list.facets}
					total={list.total}
					page={list.page}
					pageCount={list.pageCount}
				/>
			</div>
		</div>
	);
}
