import { AdminEmptyState, AdminHeader } from "@admin/components/AdminPage";
import {
	type OrderRow,
	OrdersTable,
} from "@admin/components/orders/OrdersTable";
import type { OrderStatusKey } from "@admin/lib/overview";
import { formatMoney } from "@repo/commerce";
import { DISPATCH_WINDOW_HOURS, getAdminStoreOrders } from "@repo/database";
import { ArrowRightIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Orders" };

/**
 * How many orders the table holds in the browser.
 *
 * Filtering and paging happen client side, which keeps every interaction
 * instant and needs no round trip. That only works while the whole set fits
 * comfortably in memory; past this the page needs server-side paging instead,
 * and the notice below tells an admin when they have crossed the line.
 */
const TABLE_LIMIT = 500;

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
function isLate(order: {
	paymentStatus: string;
	status: string;
	placedAt: Date;
}): boolean {
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
	return hoursWaiting > DISPATCH_WINDOW_HOURS;
}

export default async function AdminOrdersPage() {
	const orders = await getAdminStoreOrders({ take: TABLE_LIMIT });

	const rows: OrderRow[] = orders.map((order) => ({
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
		isLate: isLate(order),
	}));

	const late = rows.filter((row) => row.isLate);
	const awaitingDispatch = rows.filter(
		(row) =>
			row.paymentStatus === "PAID" &&
			[
				"PENDING",
				"CONFIRMED",
				"PROCESSING",
				"READY_FOR_DELIVERY",
			].includes(row.status),
	);
	const unpaid = rows.filter(
		(row) =>
			row.paymentStatus !== "PAID" &&
			!["CANCELLED", "REFUNDED"].includes(row.status),
	);
	const unpaidValue = unpaid.reduce(
		(sum, row) => sum + row.totalInPesewas,
		0,
	);

	// The headline reads as a sentence, so the state of the shop is legible
	// before anyone parses a table.
	const summary = [
		late.length
			? `${late.length} past the ${DISPATCH_WINDOW_HOURS}-hour window`
			: null,
		awaitingDispatch.length
			? `${awaitingDispatch.length} awaiting dispatch`
			: null,
		unpaid.length ? `${formatMoney(unpaidValue)} unpaid` : null,
	].filter(Boolean);

	const triage = [
		{
			key: "late",
			count: late.length,
			title: `Past the ${DISPATCH_WINDOW_HOURS}-hour dispatch window`,
			detail: "Paid, and the customer is still waiting",
			urgent: true,
		},
		{
			key: "dispatch",
			count: awaitingDispatch.length,
			title: "Paid and awaiting dispatch",
			detail: "Ready to pack and send",
			urgent: false,
		},
		{
			key: "unpaid",
			count: unpaid.length,
			title: "Waiting on payment",
			detail: `${formatMoney(unpaidValue)} not yet collected`,
			urgent: false,
		},
	].filter((item) => item.count > 0);

	return (
		<div>
			<AdminHeader
				eyebrow="Fulfilment"
				title="Orders"
				description={
					summary.length > 0
						? `${summary.join(" · ")}.`
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

			{orders.length === 0 ? (
				<AdminEmptyState
					title="No orders yet"
					description="Orders placed through checkout will appear here."
				/>
			) : (
				<>
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

					<div className="mt-2">
						<OrdersTable orders={rows} />
					</div>

					{orders.length === TABLE_LIMIT && (
						<p className="text-[12px] text-muted-foreground">
							Showing the {TABLE_LIMIT} most recent orders. Older
							ones are still in the database but are not loaded
							here.
						</p>
					)}
				</>
			)}
		</div>
	);
}
