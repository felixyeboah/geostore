"use client";

import { useCart } from "@commerce/components/CartProvider";
import { PaymentMarksRow } from "@commerce/components/PaymentMarks";
import { QuantityStepper } from "@commerce/components/QuantityStepper";
import { formatMoney } from "@repo/commerce";
import { Sheet, SheetContent, SheetTitle } from "@repo/ui/components/sheet";
import { ArrowRightIcon, ShoppingBagIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

/**
 * The bag drawer from design/landing-v5/02-editorial.html: a right-hand sheet
 * with the free-delivery meter at the top, hairline-separated lines, and the
 * totals pinned to the bottom.
 */
export function CartDrawer() {
	const {
		items,
		summary,
		deliveryRule,
		isDrawerOpen,
		setDrawerOpen,
		closeDrawer,
		updateQuantity,
		removeItem,
	} = useCart();

	const remaining = summary.amountUntilFreeDeliveryInPesewas;
	// A threshold of zero means delivery is free on everything, and dividing
	// by it would leave the meter at NaN% — full is the honest reading.
	const progress =
		deliveryRule.freeOverInPesewas <= 0
			? 100
			: Math.min(
					100,
					(summary.subtotalInPesewas /
						deliveryRule.freeOverInPesewas) *
						100,
				);
	const isEmpty = items.length === 0;

	return (
		<Sheet open={isDrawerOpen} onOpenChange={setDrawerOpen}>
			<SheetContent
				side="right"
				className="editorial flex w-full flex-col gap-0 border-border border-l bg-background p-0 sm:max-w-[min(520px,92vw)] [&>button]:top-6 [&>button]:right-7 [&>button]:opacity-50 [&>button]:transition-opacity hover:[&>button]:opacity-100"
			>
				<header className="flex items-baseline gap-2 border-border border-b px-7 py-[22px]">
					<SheetTitle className="font-semibold text-[19px] text-foreground tracking-[-0.025em]">
						Your bag
					</SheetTitle>
					<span className="font-medium text-[14px] text-muted-foreground tabular-nums">
						{summary.itemCount === 0
							? "empty"
							: `${summary.itemCount} ${summary.itemCount === 1 ? "item" : "items"}`}
					</span>
				</header>

				{!isEmpty && (
					<div className="border-border border-b px-7 py-4">
						<p className="text-[13px] text-muted-foreground">
							{remaining > 0 ? (
								<>
									Add{" "}
									<b className="font-semibold text-foreground tabular-nums">
										{formatMoney(remaining)}
									</b>{" "}
									more for free delivery in Accra.
								</>
							) : (
								<b className="font-semibold text-foreground">
									You’ve unlocked free delivery in Accra.
								</b>
							)}
						</p>
						<div className="mt-2.5 h-[3px] overflow-hidden rounded-full bg-muted">
							<div
								className={`h-full rounded-full transition-[width] duration-500 ${
									remaining > 0
										? "bg-[var(--ed-accent)]"
										: "bg-[#2f8c52]"
								}`}
								style={{ width: `${progress}%` }}
							/>
						</div>
					</div>
				)}

				<div className="flex-1 overflow-y-auto px-7">
					{isEmpty ? (
						<div className="flex h-full flex-col items-center justify-center py-16 text-center">
							<ShoppingBagIcon
								className="size-9 text-muted-foreground"
								strokeWidth={1.2}
							/>
							<h3 className="mt-5 font-semibold text-[17px] text-foreground tracking-[-0.02em]">
								Your bag is empty
							</h3>
							<p className="mt-2 max-w-[34ch] text-[13.5px] text-muted-foreground leading-[1.6]">
								Add something you like. It stays here while you
								browse.
							</p>
							<Link
								href="/shop"
								onClick={closeDrawer}
								className="mt-7 inline-flex h-11 items-center gap-2 rounded-[2px] bg-foreground px-6 font-semibold text-[14px] text-background tracking-[-0.01em]"
							>
								Browse the shop
								<ArrowRightIcon className="size-4" />
							</Link>
						</div>
					) : (
						items.map((item) => (
							<article
								key={`${item.productId}:${item.variantId ?? "default"}`}
								className="grid grid-cols-[88px_minmax(0,1fr)] gap-5 border-border border-b py-5 last:border-b-0"
							>
								<Link
									href={`/products/${item.slug}`}
									onClick={closeDrawer}
									className="relative size-[88px] shrink-0 self-start overflow-hidden rounded-[2px] bg-muted"
								>
									<Image
										src={item.imageUrl}
										alt=""
										fill
										sizes="88px"
										className="object-cover"
									/>
								</Link>

								<div className="flex min-w-0 flex-col">
									<div className="flex items-start justify-between gap-4">
										<div className="min-w-0">
											<Link
												href={`/products/${item.slug}`}
												onClick={closeDrawer}
												className="block font-semibold text-[14.5px] text-foreground leading-[1.3] tracking-[-0.015em] hover:text-[var(--ed-accent)]"
											>
												{item.name}
											</Link>
											<p className="mt-1 text-[12.5px] text-muted-foreground tabular-nums">
												{formatMoney(
													item.priceInPesewas,
												)}
												{item.variantName
													? ` · ${item.variantName}`
													: ""}
											</p>
											{item.stockQuantity <= 3 && (
												<p className="mt-1 text-[12px] text-[#d97706]">
													Only {item.stockQuantity}{" "}
													left
												</p>
											)}
										</div>
										<p className="shrink-0 font-semibold text-[15px] text-foreground tabular-nums">
											{formatMoney(
												item.priceInPesewas *
													item.quantity,
											)}
										</p>
									</div>

									<div className="mt-auto flex items-center justify-between gap-4 pt-4">
										<QuantityStepper
											quantity={item.quantity}
											max={item.stockQuantity}
											label={item.name}
											onChange={(quantity) =>
												updateQuantity(
													item.productId,
													quantity,
													item.variantId,
												)
											}
										/>
										<button
											type="button"
											onClick={() =>
												removeItem(
													item.productId,
													item.variantId,
												)
											}
											className="text-[12.5px] text-muted-foreground underline decoration-1 underline-offset-[3px] transition-colors hover:text-destructive"
										>
											Remove
										</button>
									</div>
								</div>
							</article>
						))
					)}
				</div>

				{!isEmpty && (
					<footer className="border-border border-t bg-background px-7 pt-5 pb-7">
						<dl className="space-y-2">
							<div className="flex justify-between text-[14px]">
								<dt className="text-muted-foreground">
									Subtotal
								</dt>
								<dd className="text-foreground tabular-nums">
									{formatMoney(summary.subtotalInPesewas)}
								</dd>
							</div>
							<div className="flex justify-between text-[14px]">
								<dt className="text-muted-foreground">
									Delivery
								</dt>
								<dd className="text-foreground">
									{summary.deliveryInPesewas === 0
										? "Free in Accra"
										: formatMoney(
												summary.deliveryInPesewas,
											)}
								</dd>
							</div>
							<div className="flex items-baseline justify-between border-border border-t pt-3.5">
								<dt className="font-semibold text-[14px] text-foreground">
									Total
								</dt>
								<dd className="font-semibold text-[22px] text-foreground tracking-[-0.03em] tabular-nums">
									{formatMoney(summary.totalInPesewas)}
								</dd>
							</div>
						</dl>

						<Link
							href="/checkout"
							onClick={closeDrawer}
							className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-[2px] bg-[var(--ed-accent)] px-6 font-semibold text-[14.5px] text-white tracking-[-0.01em] transition-colors hover:bg-[#5a1fbd]"
						>
							Checkout
							<ArrowRightIcon className="size-4" />
						</Link>

						<div className="mt-3.5 flex items-center justify-between gap-4">
							<Link
								href="/cart"
								onClick={closeDrawer}
								className="text-[12.5px] text-muted-foreground underline decoration-1 underline-offset-[3px] hover:text-foreground"
							>
								View full bag
							</Link>
							<PaymentMarksRow className="justify-end gap-x-3.5 [&>li:last-child]:hidden [&>li:nth-last-child(2)]:hidden" />
						</div>
					</footer>
				)}
			</SheetContent>
		</Sheet>
	);
}
