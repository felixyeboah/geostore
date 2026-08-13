"use client";

import {
	MOCK_REVIEWS_STORAGE_KEY,
	type MockReview,
	ReviewComposer,
} from "@commerce/components/ReviewComposer";
import { formatMoney } from "@commerce/lib/money";
import { MOCK_ORDERS_STORAGE_KEY, type MockOrder } from "@commerce/lib/order";
import { Button } from "@repo/ui/components/button";
import {
	ArrowRightIcon,
	BadgeCheckIcon,
	Clock3Icon,
	PackageOpenIcon,
	StarIcon,
	TruckIcon,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

interface OrderHistoryProps {
	initialOrders?: MockOrder[];
	limit?: number;
}

function readOrders(): MockOrder[] {
	try {
		const storedOrders = window.localStorage.getItem(
			MOCK_ORDERS_STORAGE_KEY,
		);
		const parsedOrders: unknown = storedOrders
			? JSON.parse(storedOrders)
			: [];
		return Array.isArray(parsedOrders) ? (parsedOrders as MockOrder[]) : [];
	} catch {
		return [];
	}
}

function readReviews(): MockReview[] {
	try {
		const storedReviews = window.localStorage.getItem(
			MOCK_REVIEWS_STORAGE_KEY,
		);
		const parsedReviews: unknown = storedReviews
			? JSON.parse(storedReviews)
			: [];
		return Array.isArray(parsedReviews)
			? (parsedReviews as MockReview[])
			: [];
	} catch {
		return [];
	}
}

function getStatusDetails(status: MockOrder["status"]) {
	switch (status) {
		case "delivered":
			return {
				label: "Delivered",
				icon: BadgeCheckIcon,
				className: "bg-emerald-100 text-emerald-800",
			};
		case "out-for-delivery":
			return {
				label: "Out for delivery",
				icon: TruckIcon,
				className: "bg-blue-100 text-blue-800",
			};
		case "processing":
			return {
				label: "Processing",
				icon: Clock3Icon,
				className: "bg-amber-100 text-amber-900",
			};
		case "cancelled":
			return {
				label: "Cancelled",
				icon: Clock3Icon,
				className: "bg-red-100 text-red-800",
			};
		default:
			return {
				label: "Confirmed",
				icon: BadgeCheckIcon,
				className: "bg-primary/10 text-primary",
			};
	}
}

export function OrderHistory({ initialOrders = [], limit }: OrderHistoryProps) {
	const [orders, setOrders] = useState<MockOrder[] | null>(null);
	const [reviews, setReviews] = useState<MockReview[]>([]);

	useEffect(() => {
		const localOrders = readOrders();
		const serverOrderIds = new Set(initialOrders.map((order) => order.id));
		setOrders([
			...initialOrders,
			...localOrders.filter((order) => !serverOrderIds.has(order.id)),
		]);
		setReviews(readReviews());
	}, [initialOrders]);

	const visibleOrders = useMemo(
		() => (limit ? orders?.slice(0, limit) : orders) ?? [],
		[limit, orders],
	);

	if (!orders) {
		return (
			<div
				className="h-64 animate-pulse rounded-2xl bg-muted"
				role="status"
			>
				<span className="sr-only">Loading orders</span>
			</div>
		);
	}

	if (orders.length === 0) {
		return (
			<div className="flex min-h-72 flex-col items-center justify-center rounded-2xl bg-muted/55 px-6 text-center">
				<span className="flex size-12 items-center justify-center rounded-xl bg-background">
					<PackageOpenIcon className="size-5 text-muted-foreground" />
				</span>
				<h2 className="mt-4 font-semibold text-xl">No orders yet</h2>
				<p className="mt-2 max-w-md text-muted-foreground text-sm leading-6">
					Signed-in purchases appear here automatically. Guest orders
					remain available on the device used at checkout.
				</p>
				<Button asChild className="mt-5" size="sm">
					<Link href="/">
						Browse the store <ArrowRightIcon className="size-4" />
					</Link>
				</Button>
			</div>
		);
	}

	return (
		<div className="space-y-5">
			{visibleOrders.map((order) => {
				const status = getStatusDetails(order.status);
				const StatusIcon = status.icon;

				return (
					<article
						key={order.id}
						className="overflow-hidden rounded-2xl border bg-card"
					>
						<header className="flex flex-col gap-4 border-b bg-muted/35 p-5 sm:flex-row sm:items-center sm:justify-between">
							<div>
								<p className="font-semibold tabular-nums">
									{order.id}
								</p>
								<p className="mt-1 text-muted-foreground text-xs">
									Placed{" "}
									{new Intl.DateTimeFormat("en-GH", {
										dateStyle: "medium",
										timeStyle: "short",
									}).format(new Date(order.placedAt))}
								</p>
							</div>
							<div
								className={`inline-flex w-fit items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-semibold text-xs ${status.className}`}
							>
								<StatusIcon className="size-3.5" />{" "}
								{status.label}
							</div>
						</header>

						<div className="divide-y px-5">
							{order.items.map((item) => {
								const existingReview = reviews.find(
									(review) =>
										review.orderId === order.id &&
										review.productId === item.productId,
								);
								return (
									<div key={item.productId} className="py-5">
										<div className="flex items-start justify-between gap-4">
											<div>
												<p className="font-medium">
													{item.name}
												</p>
												<p className="mt-1 text-muted-foreground text-sm">
													Quantity {item.quantity} ·{" "}
													{formatMoney(
														item.lineTotalInPesewas,
													)}
												</p>
											</div>
											{item.hasReview ||
											existingReview ? (
												<span className="inline-flex items-center gap-1.5 text-emerald-700 text-xs">
													<StarIcon className="size-3.5 fill-current" />{" "}
													Review submitted
												</span>
											) : order.status === "delivered" ? (
												<ReviewComposer
													orderId={order.id}
													orderItemId={
														item.orderItemId
													}
													productId={item.productId}
													productName={item.name}
													onSaved={(review) =>
														setReviews(
															(current) => [
																review,
																...current,
															],
														)
													}
												/>
											) : (
												<span className="text-muted-foreground text-xs">
													Review after delivery
												</span>
											)}
										</div>
									</div>
								);
							})}
						</div>

						<footer className="flex flex-col gap-3 border-t p-5 sm:flex-row sm:items-center sm:justify-between">
							<div className="text-sm">
								<span className="text-muted-foreground">
									Delivered to{" "}
								</span>
								<span className="font-medium">
									{order.address.city}, {order.address.region}
								</span>
							</div>
							<div>
								<span className="text-muted-foreground text-sm">
									Total{" "}
								</span>
								<span className="font-semibold text-lg tabular-nums">
									{formatMoney(order.totalInPesewas)}
								</span>
							</div>
						</footer>
					</article>
				);
			})}

			{limit && orders.length > limit && (
				<Button asChild variant="secondary">
					<Link href="/orders">
						View all orders <ArrowRightIcon className="size-4" />
					</Link>
				</Button>
			)}
		</div>
	);
}
