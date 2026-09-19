import { formatMoney } from "@repo/commerce";
import {
	EDITORIAL_BUTTON,
	EDITORIAL_BUTTON_QUIET,
	EditorialContainer,
	EditorialShell,
} from "@shared/components/EditorialPage";
import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";

interface CheckoutSuccessOrder {
	orderNumber: string;
	customerName: string;
	customerEmail: string;
	addressLine: string;
	city: string;
	region: string;
	paymentMethod: string;
	paymentStatus: string;
	subtotalInPesewas: number;
	deliveryInPesewas: number;
	totalInPesewas: number;
	items: Array<{
		id: string;
		name: string;
		variantName?: string | null;
		quantity: number;
		lineTotalInPesewas: number;
	}>;
}

function getAddressPart(
	shippingAddress: unknown,
	key: string,
): string | undefined {
	if (!shippingAddress || typeof shippingAddress !== "object") {
		return undefined;
	}
	const value = (shippingAddress as Record<string, unknown>)[key];
	return typeof value === "string" ? value : undefined;
}

export function toCheckoutSuccessOrder(order: {
	orderNumber: string;
	customerEmail: string;
	shippingAddress: unknown;
	paymentMethod: string;
	paymentStatus: string;
	subtotalInPesewas: number;
	deliveryInPesewas: number;
	totalInPesewas: number;
	items: Array<{
		id: string;
		productName: string;
		variantName: string | null;
		quantity: number;
		lineTotalInPesewas: number;
	}>;
}): CheckoutSuccessOrder {
	return {
		orderNumber: order.orderNumber,
		customerName:
			getAddressPart(order.shippingAddress, "recipientName") ?? "there",
		customerEmail: order.customerEmail,
		addressLine: getAddressPart(order.shippingAddress, "line1") ?? "",
		city: getAddressPart(order.shippingAddress, "city") ?? "",
		region: getAddressPart(order.shippingAddress, "region") ?? "",
		paymentMethod: order.paymentMethod,
		paymentStatus: order.paymentStatus,
		subtotalInPesewas: order.subtotalInPesewas,
		deliveryInPesewas: order.deliveryInPesewas,
		totalInPesewas: order.totalInPesewas,
		items: order.items.map((item) => ({
			id: item.id,
			name: item.productName,
			variantName: item.variantName,
			quantity: item.quantity,
			lineTotalInPesewas: item.lineTotalInPesewas,
		})),
	};
}

export function CheckoutSuccess({
	order,
}: {
	order: CheckoutSuccessOrder | null;
}) {
	if (!order) {
		return (
			<EditorialShell>
				<EditorialContainer className="py-20 lg:py-[120px]">
					<div className="max-w-[520px]">
						<p className="eyebrow mb-4 text-muted-foreground">
							Order
						</p>
						<h1 className="max-w-[18ch] font-semibold text-[clamp(30px,3.9vw,52px)] text-foreground leading-[1.03] tracking-[-0.042em]">
							We couldn’t find that order.
						</h1>
						<p className="mt-5 max-w-[46ch] text-[15.5px] text-muted-foreground leading-[1.62]">
							Check the confirmation link, or look in your account
							order history.
						</p>
						<Link
							href="/shop"
							className={`${EDITORIAL_BUTTON} mt-10`}
						>
							Return to the shop
							<ArrowRightIcon className="size-4" />
						</Link>
					</div>
				</EditorialContainer>
			</EditorialShell>
		);
	}

	const firstName = order.customerName.split(" ")[0] || "there";

	return (
		<EditorialShell>
			<EditorialContainer className="py-12 lg:py-20">
				<p className="eyebrow mb-4 text-muted-foreground">
					{order.paymentStatus === "PAID"
						? "Order confirmed"
						: "Order placed"}
				</p>
				<h1 className="max-w-[18ch] font-semibold text-[clamp(30px,3.9vw,52px)] text-foreground leading-[1.03] tracking-[-0.042em]">
					Thanks, {firstName}.
				</h1>
				<p className="mt-5 max-w-[52ch] text-[15.5px] text-muted-foreground leading-[1.62]">
					A receipt goes to {order.customerEmail} once payment is
					confirmed. Order {order.orderNumber}.
				</p>

				<div className="mt-12 grid items-start gap-12 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-20">
					<section>
						<div className="border-border border-t pt-8">
							<p className="eyebrow mb-4 text-muted-foreground">
								Delivering to
							</p>
							<p className="mt-5 text-[13.5px] text-foreground leading-[1.7]">
								{order.customerName}
								<br />
								{order.addressLine}
								<br />
								{order.city}, {order.region}
							</p>
						</div>

						<div className="mt-12 border-border border-t pt-8">
							<p className="eyebrow mb-4 text-muted-foreground">
								Items in this order
							</p>
							<ul className="mt-6 border-border border-t">
								{order.items.map((item) => (
									<li
										key={item.id}
										className="flex items-center justify-between gap-4 border-border border-b py-4"
									>
										<span className="min-w-0">
											<span className="block font-medium text-[14px] text-foreground">
												{item.name}
											</span>
											<span className="mt-1 block text-[11.5px] text-muted-foreground">
												Quantity {item.quantity}
												{item.variantName
													? ` · ${item.variantName}`
													: ""}
											</span>
										</span>
										<span className="shrink-0 font-medium text-[13px] text-foreground tabular-nums">
											{formatMoney(
												item.lineTotalInPesewas,
											)}
										</span>
									</li>
								))}
							</ul>
						</div>

						<div className="mt-12 border-border border-t pt-8">
							<p className="eyebrow mb-4 text-muted-foreground">
								Keep this reference
							</p>
							<p className="mt-5 max-w-[52ch] text-[13px] text-muted-foreground leading-[1.7]">
								Save your order number. Quote it when you get in
								touch and we can pick up exactly where your
								delivery is.
							</p>
							<div className="mt-7 flex flex-wrap items-center gap-x-8 gap-y-4">
								<Link
									href="/contact"
									className={EDITORIAL_BUTTON}
								>
									Ask about this order
									<ArrowRightIcon className="size-4" />
								</Link>
							</div>
						</div>
					</section>

					<aside className="border-border border-t pt-7">
						<p className="eyebrow mb-4 text-muted-foreground">
							Payment summary
						</p>
						<dl className="mt-7 space-y-3.5 border-border border-b pb-6 text-[13px]">
							<div className="flex justify-between gap-4">
								<dt className="text-muted-foreground">
									Subtotal
								</dt>
								<dd className="text-foreground tabular-nums">
									{formatMoney(order.subtotalInPesewas)}
								</dd>
							</div>
							<div className="flex justify-between gap-4">
								<dt className="text-muted-foreground">
									Delivery
								</dt>
								<dd className="text-foreground tabular-nums">
									{order.deliveryInPesewas === 0
										? "Free"
										: formatMoney(order.deliveryInPesewas)}
								</dd>
							</div>
							<div className="flex justify-between gap-4">
								<dt className="text-muted-foreground">
									Payment
								</dt>
								<dd className="text-foreground capitalize">
									{order.paymentMethod
										.toLocaleLowerCase()
										.replaceAll("_", " ")}
								</dd>
							</div>
						</dl>
						<div className="flex items-baseline justify-between gap-4 pt-6">
							<span className="font-medium text-[13px] text-foreground">
								Total
							</span>
							<span className="font-medium text-[26px] text-foreground tracking-[-0.02em] tabular-nums">
								{formatMoney(order.totalInPesewas)}
							</span>
						</div>
						<Link
							href="/shop"
							className={`${EDITORIAL_BUTTON_QUIET} mt-8 w-full`}
						>
							Continue shopping
							<ArrowRightIcon className="size-4" />
						</Link>
					</aside>
				</div>
			</EditorialContainer>
		</EditorialShell>
	);
}
