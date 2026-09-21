"use client";

import type { CartLine, CartSummary } from "@repo/commerce";
import { formatMoney } from "@repo/commerce";
import { cn } from "@repo/ui";
import Image from "next/image";
import type { ReactNode } from "react";

interface OrderSummaryProps {
	summary: CartSummary;
	/** Pass the bag lines to list them above the totals. */
	items?: CartLine[];
	title?: string;
	children?: ReactNode;
	className?: string;
}

/**
 * The totals block shared by the bag and checkout. Hairlines do the structural
 * work, so it sits in the page rather than floating in a card.
 */
export function OrderSummary({
	summary,
	items,
	title = "Order summary",
	children,
	className,
}: OrderSummaryProps) {
	return (
		<aside
			className={cn(
				"border-border border-t pt-7 lg:sticky lg:top-[120px]",
				className,
			)}
		>
			<p className="eyebrow text-foreground/80">{title}</p>

			{items && items.length > 0 && (
				<ul className="mt-7 space-y-4 border-border border-b pb-6">
					{items.map((item) => (
						<li
							key={`${item.productId}:${item.variantId ?? "default"}`}
							className="flex items-start gap-4"
						>
							<span className="relative size-14 shrink-0 overflow-hidden rounded-[2px] bg-muted">
								<Image
									src={item.imageUrl}
									alt=""
									fill
									sizes="56px"
									className="object-contain"
								/>
							</span>
							<span className="min-w-0 flex-1">
								<span className="block truncate font-medium text-[13.5px] text-foreground">
									{item.name}
								</span>
								<span className="mt-1 block text-[11px] text-muted-foreground">
									Qty {item.quantity}
									{item.variantName
										? ` · ${item.variantName}`
										: ""}
								</span>
							</span>
							<span className="shrink-0 font-medium text-[13px] text-foreground tabular-nums">
								{formatMoney(
									item.priceInPesewas * item.quantity,
								)}
							</span>
						</li>
					))}
				</ul>
			)}

			<dl className="mt-6 space-y-3.5 border-border border-b pb-6 text-[13px]">
				<div className="flex justify-between gap-4">
					<dt className="text-muted-foreground">Subtotal</dt>
					<dd className="text-foreground tabular-nums">
						{formatMoney(summary.subtotalInPesewas)}
					</dd>
				</div>
				<div className="flex justify-between gap-4">
					<dt className="text-muted-foreground">Delivery</dt>
					<dd className="text-foreground tabular-nums">
						{summary.deliveryInPesewas === 0
							? "Free"
							: formatMoney(summary.deliveryInPesewas)}
					</dd>
				</div>
			</dl>

			<div className="flex items-baseline justify-between gap-4 pt-6">
				<span className="font-medium text-[13px] text-foreground">
					Total
				</span>
				<span className="font-medium text-[clamp(24px,2.2vw,30px)] text-foreground tracking-[-0.035em] tabular-nums">
					{formatMoney(summary.totalInPesewas)}
				</span>
			</div>

			{children}
		</aside>
	);
}

/** Thin progress hairline toward the free-delivery threshold. */
export function FreeDeliveryNote({ summary }: { summary: CartSummary }) {
	const remaining = summary.amountUntilFreeDeliveryInPesewas;
	const total = summary.subtotalInPesewas + remaining;
	const progress =
		total > 0 ? (summary.subtotalInPesewas / total) * 100 : 100;

	return (
		<div className="mt-7 border-border border-t pt-5">
			<p className="text-[11.5px] text-muted-foreground leading-[1.6]">
				{remaining === 0
					? "This order qualifies for free delivery in Accra."
					: `Add ${formatMoney(remaining)} more for free delivery in Accra.`}
			</p>
			<div
				className="mt-3 h-px w-full bg-border"
				role="progressbar"
				aria-label="Progress toward free delivery"
				aria-valuemin={0}
				aria-valuemax={100}
				aria-valuenow={Math.round(progress)}
			>
				<div
					className="h-px bg-primary transition-[width] duration-300"
					style={{ width: `${Math.min(progress, 100)}%` }}
				/>
			</div>
		</div>
	);
}
