"use client";

import { useCart } from "@commerce/components/CartProvider";
import { formatMoney } from "@commerce/lib/money";
import { Button } from "@repo/ui/components/button";
import {
	ArrowLeftIcon,
	ArrowRightIcon,
	MinusIcon,
	PlusIcon,
	ShoppingBagIcon,
	Trash2Icon,
	TruckIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function CartPage() {
	const { items, summary, isHydrated, updateQuantity, removeItem } =
		useCart();

	if (!isHydrated) {
		return (
			<div className="container py-10 lg:py-16" aria-busy="true">
				<div className="h-12 w-52 animate-pulse rounded-xl bg-muted" />
				<div className="mt-10 grid gap-8 lg:grid-cols-[1fr_22rem]">
					<div className="h-80 animate-pulse rounded-2xl bg-muted" />
					<div className="h-72 animate-pulse rounded-2xl bg-muted" />
				</div>
			</div>
		);
	}

	if (items.length === 0) {
		return (
			<div className="container flex min-h-[34rem] items-center justify-center py-12">
				<div className="max-w-lg text-center">
					<span className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-muted">
						<ShoppingBagIcon className="size-7 text-muted-foreground" />
					</span>
					<h1 className="mt-6 font-brand font-semibold text-4xl tracking-tight">
						Your bag is ready when you are.
					</h1>
					<p className="mt-3 text-muted-foreground leading-7">
						Browse the catalogue and add the products you want to
						compare or buy. Your bag will stay here on this device.
					</p>
					<Button asChild className="mt-7" size="lg">
						<Link href="/">
							Browse products{" "}
							<ArrowRightIcon className="size-4" />
						</Link>
					</Button>
				</div>
			</div>
		);
	}

	const freeDeliveryProgress = Math.min(
		(summary.subtotalInPesewas / 100_000) * 100,
		100,
	);

	return (
		<div className="container py-10 lg:py-16">
			<Link
				href="/"
				className="inline-flex items-center gap-2 text-muted-foreground text-sm hover:text-foreground"
			>
				<ArrowLeftIcon className="size-4" /> Continue shopping
			</Link>
			<div className="mt-5 flex items-end justify-between gap-4 border-b pb-6">
				<div>
					<h1 className="font-brand font-semibold text-4xl tracking-tight sm:text-5xl">
						Your shopping bag
					</h1>
					<p className="mt-2 text-muted-foreground text-sm tabular-nums">
						{summary.itemCount}{" "}
						{summary.itemCount === 1 ? "item" : "items"}
					</p>
				</div>
			</div>

			<div className="mt-8 grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_23rem]">
				<section aria-label="Bag items" className="divide-y border-y">
					{items.map((item) => (
						<article
							key={item.productId}
							className="grid grid-cols-[6.5rem_1fr] gap-4 py-6 sm:grid-cols-[8rem_1fr_auto] sm:gap-6"
						>
							<Link
								href={`/products/${item.slug}`}
								className="relative aspect-square overflow-hidden rounded-xl bg-muted"
							>
								<Image
									src={item.imageUrl}
									alt={item.name}
									fill
									sizes="128px"
									className="object-cover"
								/>
							</Link>
							<div className="min-w-0">
								<Link
									href={`/products/${item.slug}`}
									className="font-semibold leading-6 hover:text-primary"
								>
									{item.name}
								</Link>
								<p className="mt-1 text-muted-foreground text-sm tabular-nums">
									{formatMoney(item.priceInPesewas)} each
								</p>
								<fieldset className="mt-4 inline-flex items-center rounded-lg border bg-background p-1">
									<legend className="sr-only">
										Quantity for {item.name}
									</legend>
									<button
										type="button"
										onClick={() =>
											updateQuantity(
												item.productId,
												item.quantity - 1,
											)
										}
										disabled={item.quantity <= 1}
										className="flex size-8 items-center justify-center rounded-md transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-35"
										aria-label={`Decrease ${item.name} quantity`}
									>
										<MinusIcon className="size-3.5" />
									</button>
									<span
										className="min-w-9 text-center font-semibold text-sm tabular-nums"
										aria-live="polite"
									>
										{item.quantity}
									</span>
									<button
										type="button"
										onClick={() =>
											updateQuantity(
												item.productId,
												item.quantity + 1,
											)
										}
										disabled={
											item.quantity >= item.stockQuantity
										}
										className="flex size-8 items-center justify-center rounded-md transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-35"
										aria-label={`Increase ${item.name} quantity`}
									>
										<PlusIcon className="size-3.5" />
									</button>
								</fieldset>
								{item.quantity >= item.stockQuantity && (
									<p className="mt-2 text-amber-700 text-xs">
										Maximum available quantity selected.
									</p>
								)}
							</div>
							<div className="col-span-2 flex items-end justify-between sm:col-span-1 sm:flex-col sm:items-end">
								<p className="font-semibold text-lg tabular-nums">
									{formatMoney(
										item.priceInPesewas * item.quantity,
									)}
								</p>
								<button
									type="button"
									onClick={() => removeItem(item.productId)}
									className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-muted-foreground text-xs transition hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive"
									aria-label={`Remove ${item.name} from bag`}
								>
									<Trash2Icon className="size-3.5" /> Remove
								</button>
							</div>
						</article>
					))}
				</section>

				<aside className="rounded-2xl bg-muted/55 p-5 lg:sticky lg:top-40">
					<h2 className="font-semibold text-lg">Order summary</h2>
					<div className="mt-5 space-y-3 border-b pb-5 text-sm">
						<div className="flex justify-between gap-4">
							<span className="text-muted-foreground">
								Subtotal
							</span>
							<span className="font-medium tabular-nums">
								{formatMoney(summary.subtotalInPesewas)}
							</span>
						</div>
						<div className="flex justify-between gap-4">
							<span className="text-muted-foreground">
								Delivery
							</span>
							<span className="font-medium tabular-nums">
								{summary.deliveryInPesewas === 0
									? "Free"
									: formatMoney(summary.deliveryInPesewas)}
							</span>
						</div>
					</div>
					<div className="flex justify-between gap-4 py-5">
						<span className="font-semibold">Total</span>
						<span className="font-semibold text-xl tabular-nums">
							{formatMoney(summary.totalInPesewas)}
						</span>
					</div>

					<div className="rounded-xl bg-background p-4">
						<div className="flex items-start gap-2.5">
							<TruckIcon className="mt-0.5 size-4 shrink-0 text-primary" />
							<p className="text-sm leading-5">
								{summary.amountUntilFreeDeliveryInPesewas === 0
									? "Your order qualifies for free delivery in Accra."
									: `Add ${formatMoney(summary.amountUntilFreeDeliveryInPesewas)} more for free delivery in Accra.`}
							</p>
						</div>
						<div
							className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted"
							role="progressbar"
							aria-label="Progress toward free delivery"
							aria-valuemin={0}
							aria-valuemax={100}
							aria-valuenow={Math.round(freeDeliveryProgress)}
						>
							<div
								className="h-full rounded-full bg-primary transition-[width] duration-300"
								style={{ width: `${freeDeliveryProgress}%` }}
							/>
						</div>
					</div>

					<Button asChild size="lg" className="mt-5 h-12 w-full">
						<Link href="/checkout">
							Continue to checkout{" "}
							<ArrowRightIcon className="size-4" />
						</Link>
					</Button>
					<p className="mt-3 text-center text-muted-foreground text-xs leading-5">
						Mock checkout only. No real payment will be taken.
					</p>
				</aside>
			</div>
		</div>
	);
}
