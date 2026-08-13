"use client";

import { formatMoney } from "@commerce/lib/money";
import { MOCK_ORDERS_STORAGE_KEY, type MockOrder } from "@commerce/lib/order";
import { Button } from "@repo/ui/components/button";
import {
	ArrowRightIcon,
	BadgeCheckIcon,
	CircleUserRoundIcon,
	ReceiptTextIcon,
	TruckIcon,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

function findOrder(orderId: string | null): MockOrder | null {
	try {
		const storedOrders = window.localStorage.getItem(
			MOCK_ORDERS_STORAGE_KEY,
		);
		const parsedOrders: unknown = storedOrders
			? JSON.parse(storedOrders)
			: [];
		return Array.isArray(parsedOrders)
			? ((parsedOrders as MockOrder[]).find(
					(order) => order.id === orderId,
				) ?? null)
			: null;
	} catch {
		return null;
	}
}

export function CheckoutSuccess({ isSignedIn }: { isSignedIn: boolean }) {
	const searchParams = useSearchParams();
	const [order, setOrder] = useState<MockOrder | null | undefined>(undefined);

	useEffect(() => {
		setOrder(findOrder(searchParams.get("order")));
	}, [searchParams]);

	if (order === undefined) {
		return (
			<div className="container py-12">
				<div className="h-[32rem] animate-pulse rounded-2xl bg-muted" />
			</div>
		);
	}

	if (!order) {
		return (
			<div className="container flex min-h-[34rem] items-center justify-center py-12">
				<div className="max-w-lg text-center">
					<span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-muted">
						<ReceiptTextIcon className="size-6 text-muted-foreground" />
					</span>
					<h1 className="mt-5 font-brand font-semibold text-4xl tracking-tight">
						We couldn’t find that order.
					</h1>
					<p className="mt-3 text-muted-foreground leading-7">
						Mock orders are stored on the device where checkout was
						completed. The order may have been cleared or opened on
						another device.
					</p>
					<Button asChild className="mt-7">
						<Link href="/">Return to the store</Link>
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="container py-10 lg:py-16">
			<section className="overflow-hidden rounded-[2rem] bg-[#e9f0e8] text-[#142016]">
				<div className="grid lg:grid-cols-[1.15fr_0.85fr]">
					<div className="p-8 sm:p-10 lg:p-14">
						<span className="flex size-12 items-center justify-center rounded-2xl bg-[#142016] text-white">
							<BadgeCheckIcon className="size-6" />
						</span>
						<p className="mt-7 font-semibold text-sm">
							Order confirmed
						</p>
						<h1 className="mt-2 text-balance font-brand font-semibold text-5xl leading-tight tracking-[-0.04em] sm:text-6xl">
							Thanks, {order.customer.name.split(" ")[0]}.
						</h1>
						<p className="mt-4 max-w-xl text-[#405144] leading-7">
							Your mock order is complete. A real checkout would
							now send a receipt to{" "}
							<strong>{order.customer.email}</strong> and start
							delivery updates.
						</p>
						<div className="mt-7 inline-flex rounded-lg bg-white/70 px-4 py-2 font-semibold text-sm tabular-nums">
							Order {order.id}
						</div>
					</div>
					<div className="flex items-end bg-[#d9e6d8] p-8 sm:p-10 lg:p-12">
						<div className="w-full">
							<div className="flex items-center gap-3">
								<TruckIcon className="size-5" />
								<p className="font-semibold">
									Delivery details
								</p>
							</div>
							<p className="mt-3 text-sm leading-6">
								{order.address.line1}
								{order.address.line2
									? `, ${order.address.line2}`
									: ""}
								<br />
								{order.address.city}, {order.address.region}
							</p>
							<p className="mt-4 text-[#526255] text-xs">
								Demo status: confirmed and ready for processing
							</p>
						</div>
					</div>
				</div>
			</section>

			<div className="mt-8 grid items-start gap-8 lg:grid-cols-[1fr_23rem]">
				<section>
					<h2 className="font-semibold text-xl">
						Items in this order
					</h2>
					<div className="mt-4 divide-y border-y">
						{order.items.map((item) => (
							<div
								key={item.productId}
								className="flex items-center justify-between gap-4 py-4"
							>
								<div>
									<p className="font-medium">{item.name}</p>
									<p className="mt-1 text-muted-foreground text-sm">
										Quantity {item.quantity}
									</p>
								</div>
								<p className="font-semibold tabular-nums">
									{formatMoney(item.lineTotalInPesewas)}
								</p>
							</div>
						))}
					</div>

					<div className="mt-8 rounded-2xl border p-5">
						<div className="flex items-start gap-4">
							<CircleUserRoundIcon className="mt-0.5 size-6 shrink-0 text-primary" />
							<div>
								<h2 className="font-semibold">
									Keep your orders together
								</h2>
								<p className="mt-2 text-muted-foreground text-sm leading-6">
									{isSignedIn
										? "This purchase is saved to your account. Track fulfilment and review delivered items from your order history."
										: "Create an account before your next purchase to sync order history across devices and leave verified reviews after delivery."}
								</p>
								<div className="mt-4 flex flex-wrap gap-3">
									{isSignedIn ? (
										<Button asChild size="sm">
											<Link href="/orders">
												View order history
											</Link>
										</Button>
									) : (
										<>
											<Button asChild size="sm">
												<Link href="/signup">
													Create account
												</Link>
											</Button>
											<Button
												asChild
												size="sm"
												variant="secondary"
											>
												<Link href="/login">
													Sign in
												</Link>
											</Button>
										</>
									)}
								</div>
							</div>
						</div>
					</div>
				</section>

				<aside className="rounded-2xl bg-muted/55 p-5">
					<h2 className="font-semibold">Payment summary</h2>
					<div className="mt-5 space-y-3 border-b pb-5 text-sm">
						<div className="flex justify-between">
							<span className="text-muted-foreground">
								Subtotal
							</span>
							<span className="tabular-nums">
								{formatMoney(order.subtotalInPesewas)}
							</span>
						</div>
						<div className="flex justify-between">
							<span className="text-muted-foreground">
								Delivery
							</span>
							<span>
								{order.deliveryInPesewas === 0
									? "Free"
									: formatMoney(order.deliveryInPesewas)}
							</span>
						</div>
						<div className="flex justify-between">
							<span className="text-muted-foreground">
								Payment
							</span>
							<span className="capitalize">
								{order.paymentMethod}
							</span>
						</div>
					</div>
					<div className="flex items-end justify-between gap-4 pt-5">
						<span className="font-semibold">Total</span>
						<span className="font-semibold text-xl tabular-nums">
							{formatMoney(order.totalInPesewas)}
						</span>
					</div>
					<Button asChild variant="secondary" className="mt-5 w-full">
						<Link href="/">
							Continue shopping{" "}
							<ArrowRightIcon className="size-4" />
						</Link>
					</Button>
				</aside>
			</div>
		</div>
	);
}
