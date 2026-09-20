import { OrderStatusSelect } from "@admin/components/orders/OrderStatusSelect";
import { OrderStatusBadge } from "@admin/components/overview/OrderStatusBadge";
import type { AdminOrderDetail } from "@admin/lib/order-detail";
import {
	formatRelativeTime,
	PAYMENT_METHOD_LABELS,
	type StatusTone,
} from "@admin/lib/overview";
import { formatMoney } from "@repo/commerce";
import { cn } from "@repo/ui";
import { PackageIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

const MONO = "font-mono tabular-nums";

const PAYMENT_STATUS_TONES: Record<string, StatusTone> = {
	PAID: "success",
	PENDING: "warning",
	FAILED: "danger",
	REFUNDED: "neutral",
};

const DOT_TONES: Record<StatusTone, string> = {
	neutral: "bg-muted-foreground/60",
	info: "bg-indigo-500",
	warning: "bg-amber-500",
	success: "bg-success",
	danger: "bg-destructive",
};

export function formatOrderTime(iso: string): string {
	return new Intl.DateTimeFormat("en-GH", {
		day: "numeric",
		month: "short",
		hour: "2-digit",
		minute: "2-digit",
	}).format(new Date(iso));
}

export function paymentMethodLabel(value: string): string {
	return (
		PAYMENT_METHOD_LABELS[value as keyof typeof PAYMENT_METHOD_LABELS] ??
		value
			.toLocaleLowerCase()
			.replace(/_/g, " ")
			.replace(/^./, (character) => character.toLocaleUpperCase())
	);
}

function PaymentBadge({ status }: { status: string }) {
	const label = status
		.toLocaleLowerCase()
		.replace(/_/g, " ")
		.replace(/^./, (character) => character.toLocaleUpperCase());
	return (
		<span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-[2px] border border-border px-2 py-0.5 font-medium text-[11.5px] text-muted-foreground">
			<span
				aria-hidden="true"
				className={cn(
					"size-1.5 rounded-full",
					DOT_TONES[PAYMENT_STATUS_TONES[status] ?? "neutral"],
				)}
			/>
			{label}
		</span>
	);
}

function DetailSection({
	label,
	children,
	className,
}: {
	label: string;
	children: ReactNode;
	className?: string;
}) {
	return (
		<section className={cn("border-border border-b pb-7", className)}>
			<p className="eyebrow mb-4 text-muted-foreground">{label}</p>
			{children}
		</section>
	);
}

function KeyValue({ label, children }: { label: string; children: ReactNode }) {
	return (
		<div className="flex items-baseline justify-between gap-6 py-1.5">
			<dt className="shrink-0 text-[12.5px] text-muted-foreground">
				{label}
			</dt>
			<dd className="min-w-0 text-right text-[13px] text-foreground">
				{children}
			</dd>
		</div>
	);
}

/** What the customer is actually waiting on. */
export function OrderItemsSection({ order }: { order: AdminOrderDetail }) {
	return (
		<DetailSection label={`Items · ${order.items.length}`}>
			<ul className="divide-y divide-border/60">
				{order.items.map((item) => (
					<li
						key={item.id}
						className="flex items-center gap-4 py-3.5 first:pt-0 last:pb-0"
					>
						<div className="relative size-11 shrink-0 overflow-hidden rounded-[2px] bg-muted">
							{item.imageUrl ? (
								<Image
									src={item.imageUrl}
									alt=""
									fill
									sizes="44px"
									className="object-cover"
								/>
							) : (
								<PackageIcon
									className="absolute inset-0 m-auto size-4 text-muted-foreground/50"
									strokeWidth={1.5}
								/>
							)}
						</div>
						<div className="min-w-0 flex-1">
							<Link
								href={`/admin/products/${item.productId}`}
								className="block truncate font-medium text-[13.5px] text-foreground transition-colors hover:text-[var(--ed-accent)]"
							>
								{item.productName}
							</Link>
							<span className="mt-0.5 block truncate text-[12px] text-muted-foreground">
								{[item.variantName, item.sku]
									.filter(Boolean)
									.join(" · ")}
							</span>
						</div>
						<span
							className={cn(
								"shrink-0 text-[12.5px] text-muted-foreground",
								MONO,
							)}
						>
							{item.quantity} ×{" "}
							{formatMoney(item.unitPriceInPesewas)}
						</span>
						<span
							className={cn(
								"w-20 shrink-0 text-right font-medium text-[13px] text-foreground",
								MONO,
							)}
						>
							{formatMoney(item.lineTotalInPesewas)}
						</span>
					</li>
				))}
			</ul>
		</DetailSection>
	);
}

/** How the money moves, and whether it has. */
export function OrderPaymentSection({ order }: { order: AdminOrderDetail }) {
	return (
		<DetailSection label="Payment">
			<div className="mb-4 flex flex-wrap items-center gap-2">
				<PaymentBadge status={order.paymentStatus} />
				<span className="text-[12.5px] text-muted-foreground">
					{paymentMethodLabel(order.paymentMethod)}
				</span>
			</div>
			<dl>
				<KeyValue label="Subtotal">
					<span className={MONO}>
						{formatMoney(order.subtotalInPesewas)}
					</span>
				</KeyValue>
				<KeyValue label="Delivery">
					<span className={MONO}>
						{order.deliveryInPesewas === 0
							? "Free"
							: formatMoney(order.deliveryInPesewas)}
					</span>
				</KeyValue>
				{order.discountInPesewas > 0 && (
					<KeyValue label="Discount">
						<span className={MONO}>
							−{formatMoney(order.discountInPesewas)}
						</span>
					</KeyValue>
				)}
				<div className="mt-2 flex items-baseline justify-between gap-6 border-border border-t pt-3">
					<dt className="font-medium text-[13px] text-foreground">
						Total
					</dt>
					<dd
						className={cn(
							"font-semibold text-[16px] text-foreground",
							MONO,
						)}
					>
						{formatMoney(order.totalInPesewas)}
					</dd>
				</div>
			</dl>
			{order.transactions.length > 0 && (
				<ul className="mt-4 space-y-2.5 border-border/60 border-t pt-4">
					{order.transactions.map((transaction) => (
						<li
							key={transaction.id}
							className="flex items-baseline justify-between gap-4"
						>
							<span className="min-w-0">
								<span
									className={cn(
										"block truncate text-[12px] text-foreground",
										MONO,
									)}
								>
									{transaction.reference}
								</span>
								<span className="mt-0.5 block text-[11.5px] text-muted-foreground capitalize">
									{transaction.provider}
									{transaction.providerPaymentId
										? ` · ${transaction.providerPaymentId}`
										: ""}
								</span>
							</span>
							<span className="shrink-0 text-right text-[11.5px] text-muted-foreground">
								{transaction.status
									.toLocaleLowerCase()
									.replace(/_/g, " ")}
							</span>
						</li>
					))}
				</ul>
			)}
		</DetailSection>
	);
}

export function OrderCustomerSection({ order }: { order: AdminOrderDetail }) {
	return (
		<DetailSection label="Customer">
			<p className="font-medium text-[14px] text-foreground">
				{order.customerName}
			</p>
			<p className="mt-1.5 text-[13px] text-muted-foreground">
				{order.customerEmail}
			</p>
			<p className="mt-0.5 text-[13px] text-muted-foreground">
				{order.customerPhone}
			</p>
			{order.accountName && order.accountName !== order.customerName && (
				<p className="mt-2 text-[12px] text-muted-foreground">
					Account: {order.accountName}
				</p>
			)}
		</DetailSection>
	);
}

export function OrderDeliverySection({ order }: { order: AdminOrderDetail }) {
	return (
		<DetailSection label="Delivery">
			{order.addressLines.length > 0 ? (
				<div className="space-y-0.5">
					{order.addressLines.map((line) => (
						<p
							key={line}
							className="text-[13px] text-foreground leading-[1.55]"
						>
							{line}
						</p>
					))}
				</div>
			) : (
				<p className="text-[13px] text-muted-foreground">
					No address on the order.
				</p>
			)}
			{order.customerNote && (
				<p className="mt-3 border-border/60 border-l-2 pl-3 text-[12.5px] text-muted-foreground italic leading-[1.6]">
					“{order.customerNote}”
				</p>
			)}
		</DetailSection>
	);
}

/** What has happened to the order so far, oldest first. */
export function OrderTimelineSection({ order }: { order: AdminOrderDetail }) {
	if (order.events.length === 0) {
		return null;
	}
	return (
		<DetailSection label="Timeline" className="border-b-0 pb-0">
			<ol className="space-y-3">
				{order.events.map((event, index) => (
					<li key={event.id} className="flex items-baseline gap-3">
						<span
							aria-hidden="true"
							className={cn(
								"mt-1.5 size-1.5 shrink-0 rounded-full",
								index === order.events.length - 1
									? "bg-foreground"
									: "bg-muted-foreground/40",
							)}
						/>
						<span className="min-w-0 flex-1 text-[13px] text-foreground">
							{event.note ??
								`Marked ${event.status
									.toLocaleLowerCase()
									.replace(/_/g, " ")}`}
						</span>
						<span
							className={cn(
								"shrink-0 text-[11.5px] text-muted-foreground",
								MONO,
							)}
						>
							{formatOrderTime(event.createdAt)}
						</span>
					</li>
				))}
			</ol>
		</DetailSection>
	);
}

/**
 * The sheet layout: everything stacked, tightened for a panel. The full page
 * composes the same sections differently — customer and delivery sit in its
 * right rail.
 */
export function OrderDetail({ order }: { order: AdminOrderDetail }) {
	return (
		<div className="space-y-7">
			<OrderItemsSection order={order} />
			<OrderPaymentSection order={order} />
			<OrderCustomerSection order={order} />
			<OrderDeliverySection order={order} />
			<OrderTimelineSection order={order} />
		</div>
	);
}

/** Fulfilment + payment chips, shared by the sheet header and the page. */
export function OrderBadges({ order }: { order: AdminOrderDetail }) {
	return (
		<div className="flex flex-wrap items-center gap-2.5">
			<OrderStatusBadge status={order.status} />
			<PaymentBadge status={order.paymentStatus} />
			<span className="text-[11.5px] text-muted-foreground">
				{paymentMethodLabel(order.paymentMethod)}
			</span>
		</div>
	);
}

export function OrderDetailHeader({
	order,
	showFullLink,
}: {
	order: AdminOrderDetail;
	/** Sheet only — the route already is the full page. */
	showFullLink?: boolean;
}) {
	const placed = new Date(order.placedAt);
	return (
		<div>
			<OrderBadges order={order} />
			<p className="mt-3 text-[12.5px] text-muted-foreground">
				Placed {formatOrderTime(order.placedAt)} ·{" "}
				{formatRelativeTime(placed, new Date())}
			</p>
			{showFullLink && (
				<Link
					href={`/admin/orders/${order.orderNumber}`}
					className="mt-3 inline-flex items-center gap-1.5 text-[12.5px] text-foreground underline decoration-border underline-offset-4 transition-colors hover:decoration-foreground"
				>
					Open order page
				</Link>
			)}
		</div>
	);
}

/** Status control + mark-paid, shared by the sheet footer and the page rail. */
export function OrderDetailActions({
	order,
	onChanged,
}: {
	order: AdminOrderDetail;
	/** Sheet only — lets it refetch its own copy after a change lands. */
	onChanged?: () => void;
}) {
	return (
		<OrderStatusSelect
			orderId={order.id}
			status={order.status}
			paymentStatus={order.paymentStatus}
			paymentMethod={order.paymentMethod}
			onChanged={onChanged}
		/>
	);
}
