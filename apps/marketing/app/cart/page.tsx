"use client";

import { useCart } from "@commerce/components/CartProvider";
import {
	FreeDeliveryNote,
	OrderSummary,
} from "@commerce/components/OrderSummary";
import { PaymentMarks } from "@commerce/components/PaymentMarks";
import { QuantityStepper } from "@commerce/components/QuantityStepper";
import { formatMoney } from "@repo/commerce";
import {
	EDITORIAL_BUTTON,
	EditorialContainer,
	EditorialHeader,
	EditorialShell,
} from "@shared/components/EditorialPage";
import { ArrowLeftIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function CartPage() {
	const { items, summary, isHydrated, updateQuantity, removeItem } =
		useCart();

	if (!isHydrated) {
		return (
			<EditorialShell>
				<EditorialContainer className="py-12 lg:py-20">
					<div aria-busy="true">
						<div className="h-3 w-24 animate-pulse rounded-[2px] bg-muted" />
						<div className="mt-5 h-12 w-72 animate-pulse rounded-[2px] bg-muted" />
						<div className="mt-14 grid gap-14 lg:grid-cols-[minmax(0,1fr)_380px]">
							<div className="h-80 animate-pulse rounded-[2px] bg-muted" />
							<div className="h-64 animate-pulse rounded-[2px] bg-muted" />
						</div>
						<span className="sr-only">Loading your bag</span>
					</div>
				</EditorialContainer>
			</EditorialShell>
		);
	}

	if (items.length === 0) {
		return (
			<EditorialShell>
				<EditorialContainer className="py-20 lg:py-[120px]">
					<EditorialHeader
						eyebrow="Your bag"
						title="Nothing in the bag yet."
						subtitle="Add the products you want to compare or buy. The bag stays on this device, so you can come back to it later."
					/>
					<Link href="/shop" className={`${EDITORIAL_BUTTON} mt-10`}>
						Browse products
					</Link>
				</EditorialContainer>
			</EditorialShell>
		);
	}

	return (
		<EditorialShell>
			<EditorialContainer className="py-12 lg:py-20">
				<Link
					href="/shop"
					className="group inline-flex items-center gap-2.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
				>
					<ArrowLeftIcon className="size-4 transition-transform group-hover:-translate-x-0.5" />
					Continue shopping
				</Link>

				<div className="mt-9">
					<EditorialHeader
						eyebrow="The bag"
						title="Your bag"
						aside={`${String(summary.itemCount).padStart(2, "0")} — ${summary.itemCount === 1 ? "item" : "items"}`}
					/>
				</div>

				<div className="mt-14 grid items-start gap-14 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-20">
					<section
						aria-label="Bag items"
						className="border-foreground border-t"
					>
						{items.map((item) => (
							<article
								key={`${item.productId}:${item.variantId ?? "default"}`}
								className="grid grid-cols-[96px_minmax(0,1fr)] gap-6 border-border border-b py-8 sm:grid-cols-[140px_minmax(0,1fr)_auto] sm:gap-8"
							>
								<Link
									href={`/products/${item.slug}`}
									className="relative aspect-[4/5] overflow-hidden rounded-[2px] bg-muted"
								>
									<Image
										src={item.imageUrl}
										alt={item.name}
										fill
										sizes="140px"
										className="object-cover"
									/>
								</Link>

								<div className="min-w-0">
									<Link
										href={`/products/${item.slug}`}
										className="font-semibold text-[clamp(17px,1.5vw,20px)] text-foreground leading-[1.15] tracking-[-0.03em] hover:text-[var(--ed-accent)]"
									>
										{item.name}
									</Link>
									<p className="mt-2.5 text-[13px] text-muted-foreground tabular-nums">
										{formatMoney(item.priceInPesewas)} each
										{item.variantName
											? ` · ${item.variantName}`
											: ""}
									</p>

									<div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
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
											className="text-[12.5px] text-muted-foreground underline decoration-1 underline-offset-[3px] transition-colors hover:text-foreground"
										>
											Remove
										</button>
									</div>

									{item.quantity >= item.stockQuantity && (
										<p className="eyebrow mt-4 text-[var(--ed-accent)]">
											All we hold right now
										</p>
									)}
								</div>

								<p className="col-span-2 font-semibold text-[16px] text-foreground tabular-nums sm:col-span-1 sm:text-right">
									{formatMoney(
										item.priceInPesewas * item.quantity,
									)}
								</p>
							</article>
						))}
					</section>

					<OrderSummary summary={summary}>
						<FreeDeliveryNote summary={summary} />

						<Link
							href="/checkout"
							className={`${EDITORIAL_BUTTON} mt-8 w-full`}
						>
							Continue to checkout
						</Link>

						<div className="mt-8 border-border border-t pt-6">
							<p className="eyebrow text-muted-foreground">
								Ways to pay
							</p>
							<PaymentMarks className="mt-4" withCaption />
						</div>
					</OrderSummary>
				</div>
			</EditorialContainer>
		</EditorialShell>
	);
}
