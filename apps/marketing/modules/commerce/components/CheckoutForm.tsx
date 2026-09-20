"use client";

import { placeStoreOrderAction } from "@commerce/actions/checkout";
import { useCart } from "@commerce/components/CartProvider";
import { OrderSummary } from "@commerce/components/OrderSummary";
import { zodResolver } from "@hookform/resolvers/zod";
import { formatMoney, whatsAppLink } from "@repo/commerce";
import { cn } from "@repo/ui";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@repo/ui/components/form";
import { Input } from "@repo/ui/components/input";
import { Textarea } from "@repo/ui/components/textarea";
import {
	EDITORIAL_BUTTON,
	EditorialContainer,
	EditorialHeader,
	EditorialShell,
} from "@shared/components/EditorialPage";
import type { StorefrontCheckout } from "@shared/lib/store-settings";
import { ArrowLeftIcon, LockKeyholeIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

/** Squared, hairline fields to match the rest of the storefront. */
const FIELD =
	"h-12 rounded-[2px] border-border bg-transparent px-3.5 text-[14px] shadow-none placeholder:text-muted-foreground/70 focus-visible:border-foreground focus-visible:ring-0";
const LABEL = "eyebrow text-muted-foreground";

const checkoutSchema = z.object({
	name: z.string().trim().min(2, "Enter the recipient’s full name."),
	email: z.string().trim().email("Enter a valid email address."),
	phone: z
		.string()
		.trim()
		.min(10, "Enter a phone number we can use for delivery.")
		.regex(/^[+\d\s()-]+$/, "Use a valid phone number."),
	line1: z
		.string()
		.trim()
		.min(5, "Enter a complete street or landmark address."),
	line2: z.string().trim().optional(),
	city: z.string().trim().min(2, "Enter your town or city."),
	region: z.string().trim().min(2, "Enter your region."),
	note: z
		.string()
		.trim()
		.max(300, "Keep delivery notes under 300 characters.")
		.optional(),
	paymentMethod: z.enum(["ONLINE", "CASH_ON_DELIVERY", "WHATSAPP"]),
});

type CheckoutValues = z.infer<typeof checkoutSchema>;

export interface CheckoutPrefill {
	name?: string;
	email?: string;
	phone?: string;
	line1?: string;
	line2?: string;
	city?: string;
	region?: string;
}

export function CheckoutForm({
	prefill = {},
	paymentProvider,
	checkout,
}: {
	prefill?: CheckoutPrefill;
	paymentProvider: "reevit" | "mock";
	checkout: StorefrontCheckout;
}) {
	const { items, summary, isHydrated, clearCart } = useCart();
	const router = useRouter();
	const isCompletingCheckout = useRef(false);
	// With online payment off, WhatsApp ordering is offered only when the
	// number can actually be dialled — otherwise cash on delivery stands
	// alone rather than showing a link that goes nowhere.
	const whatsappHref = checkout.onlinePaymentsEnabled
		? null
		: whatsAppLink(checkout.whatsappNumber);
	const form = useForm<CheckoutValues>({
		resolver: zodResolver(checkoutSchema),
		defaultValues: {
			name: prefill.name ?? "",
			email: prefill.email ?? "",
			phone: prefill.phone ?? "",
			line1: prefill.line1 ?? "",
			line2: prefill.line2 ?? "",
			city: prefill.city ?? "Accra",
			region: prefill.region ?? "Greater Accra",
			note: "",
			paymentMethod: checkout.onlinePaymentsEnabled
				? "ONLINE"
				: whatsappHref
					? "WHATSAPP"
					: "CASH_ON_DELIVERY",
		},
	});

	const idempotencyKeyRef = useRef<string | null>(null);

	useEffect(() => {
		if (isHydrated && items.length === 0 && !isCompletingCheckout.current) {
			router.replace("/cart");
		}
	}, [isHydrated, items.length, router]);

	const onSubmit = form.handleSubmit(async (values) => {
		isCompletingCheckout.current = true;

		// Stable across retries of the same attempt, so a resubmitted request
		// gets back the order it already made instead of a duplicate. It is
		// rotated below once an attempt fails outright, because then nothing
		// was created and the next press really is a new order.
		idempotencyKeyRef.current ??= crypto.randomUUID();

		const result = await placeStoreOrderAction({
			customer: {
				name: values.name,
				email: values.email,
				phone: values.phone,
			},
			address: {
				line1: values.line1,
				line2: values.line2 || undefined,
				city: values.city,
				region: values.region,
			},
			items: items.map((item) => ({
				productId: item.productId,
				variantId: item.variantId,
				quantity: item.quantity,
			})),
			customerNote: values.note || undefined,
			paymentMethod: values.paymentMethod,
			idempotencyKey: idempotencyKeyRef.current,
		});

		if (!result.success || !result.order) {
			isCompletingCheckout.current = false;
			idempotencyKeyRef.current = null;
			form.setError("root", {
				message:
					result.message ??
					"We couldn’t place the order. Please try again.",
			});
			return;
		}

		const accessToken = encodeURIComponent(result.order.accessToken);

		if (result.order.next === "pay") {
			// Keep the bag intact until the payment actually clears, so a
			// declined mobile-money prompt can be retried from a full cart.
			router.push(
				`/checkout/pay?order=${encodeURIComponent(result.order.id)}&payment=${encodeURIComponent(result.order.paymentId ?? "")}&t=${accessToken}`,
			);
			return;
		}

		clearCart();
		router.push(
			`/checkout/success?order=${encodeURIComponent(result.order.orderNumber)}&t=${accessToken}`,
		);
	});

	if (!isHydrated || items.length === 0) {
		return (
			<EditorialShell>
				<EditorialContainer className="py-12 lg:py-20">
					<div aria-busy="true">
						<div className="h-3 w-32 animate-pulse rounded-[2px] bg-muted" />
						<div className="mt-5 h-12 w-96 animate-pulse rounded-[2px] bg-muted" />
						<div className="mt-14 grid gap-14 lg:grid-cols-[minmax(0,1fr)_380px]">
							<div className="h-[32rem] animate-pulse rounded-[2px] bg-muted" />
							<div className="h-72 animate-pulse rounded-[2px] bg-muted" />
						</div>
						<span className="sr-only">Loading checkout</span>
					</div>
				</EditorialContainer>
			</EditorialShell>
		);
	}

	const method = form.watch("paymentMethod");
	const isTwoStep = paymentProvider === "reevit" && method === "ONLINE";
	const submitLabel = isTwoStep
		? `Continue to payment · ${formatMoney(summary.totalInPesewas)}`
		: `Place order · ${formatMoney(summary.totalInPesewas)}`;

	return (
		<EditorialShell>
			<EditorialContainer className="py-12 lg:py-20">
				<Link
					href="/cart"
					className="group inline-flex items-center gap-2.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
				>
					<ArrowLeftIcon className="size-4 transition-transform group-hover:-translate-x-0.5" />
					Back to bag
				</Link>

				<div className="mt-9 grid items-start gap-14 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-20">
					<div>
						<EditorialHeader
							eyebrow={`Secure checkout · Step 1 of ${isTwoStep ? "2" : "1"}`}
							title="Where should we deliver?"
							subtitle={
								checkout.onlinePaymentsEnabled
									? "You are only charged once mobile money or card payment succeeds. Cash on delivery is settled with the rider."
									: "Confirm the order on WhatsApp or pay the rider on delivery — nothing is charged online."
							}
						/>

						<Form {...form}>
							<form
								onSubmit={onSubmit}
								className="mt-12"
								noValidate
							>
								<fieldset className="border-border border-t pt-8">
									<legend className="sr-only">
										Contact details
									</legend>
									<p className="eyebrow text-muted-foreground">
										Contact details
									</p>
									<p className="mt-3 text-[12px] text-muted-foreground">
										Used for the receipt and delivery
										updates.
									</p>
									<div className="mt-7 grid gap-5 sm:grid-cols-2">
										<FormField
											control={form.control}
											name="name"
											render={({ field }) => (
												<FormItem className="sm:col-span-2">
													<FormLabel
														className={LABEL}
													>
														Full name
													</FormLabel>
													<FormControl>
														<Input
															autoComplete="name"
															placeholder="Abena Mensah"
															className={FIELD}
															{...field}
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
										<FormField
											control={form.control}
											name="email"
											render={({ field }) => (
												<FormItem>
													<FormLabel
														className={LABEL}
													>
														Email address
													</FormLabel>
													<FormControl>
														<Input
															type="email"
															autoComplete="email"
															placeholder="abena@example.com"
															className={FIELD}
															{...field}
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
										<FormField
											control={form.control}
											name="phone"
											render={({ field }) => (
												<FormItem>
													<FormLabel
														className={LABEL}
													>
														Phone number
													</FormLabel>
													<FormControl>
														<Input
															type="tel"
															autoComplete="tel"
															placeholder="+233 24 555 0192"
															className={FIELD}
															{...field}
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
									</div>
								</fieldset>

								<fieldset className="mt-12 border-border border-t pt-8">
									<legend className="sr-only">
										Delivery address
									</legend>
									<p className="eyebrow text-muted-foreground">
										Delivery address
									</p>
									<div className="mt-7 grid gap-5 sm:grid-cols-2">
										<FormField
											control={form.control}
											name="line1"
											render={({ field }) => (
												<FormItem className="sm:col-span-2">
													<FormLabel
														className={LABEL}
													>
														Street address or
														landmark
													</FormLabel>
													<FormControl>
														<Input
															autoComplete="address-line1"
															placeholder="14 Independence Avenue"
															className={FIELD}
															{...field}
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
										<FormField
											control={form.control}
											name="line2"
											render={({ field }) => (
												<FormItem className="sm:col-span-2">
													<FormLabel
														className={LABEL}
													>
														Apartment, floor or
														directions{" "}
														<span className="font-normal text-muted-foreground">
															(optional)
														</span>
													</FormLabel>
													<FormControl>
														<Input
															autoComplete="address-line2"
															placeholder="Second floor, blue gate"
															className={FIELD}
															{...field}
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
										<FormField
											control={form.control}
											name="city"
											render={({ field }) => (
												<FormItem>
													<FormLabel
														className={LABEL}
													>
														Town or city
													</FormLabel>
													<FormControl>
														<Input
															autoComplete="address-level2"
															className={FIELD}
															{...field}
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
										<FormField
											control={form.control}
											name="region"
											render={({ field }) => (
												<FormItem>
													<FormLabel
														className={LABEL}
													>
														Region
													</FormLabel>
													<FormControl>
														<Input
															autoComplete="address-level1"
															className={FIELD}
															{...field}
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
										<FormField
											control={form.control}
											name="note"
											render={({ field }) => (
												<FormItem className="sm:col-span-2">
													<FormLabel
														className={LABEL}
													>
														Delivery note{" "}
														<span className="font-normal text-muted-foreground">
															(optional)
														</span>
													</FormLabel>
													<FormControl>
														<Textarea
															rows={3}
															placeholder="A useful landmark, or when to call"
															className="rounded-[2px] border-border bg-transparent px-3.5 py-3 text-[14px] shadow-none placeholder:text-muted-foreground/70 focus-visible:border-foreground focus-visible:ring-0"
															{...field}
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
									</div>
								</fieldset>

								<fieldset className="mt-12 border-border border-t pt-8">
									<legend className="sr-only">Payment</legend>
									<p className="eyebrow text-muted-foreground">
										Payment
									</p>
									<FormField
										control={form.control}
										name="paymentMethod"
										render={({ field }) => (
											<div className="mt-7 border-border border-t">
												{checkout.onlinePaymentsEnabled ? (
													<PaymentChoice
														selected={
															field.value ===
															"ONLINE"
														}
														title="Pay online"
														description="Mobile money or card. You pick the method on the secure payment page."
														onSelect={() =>
															field.onChange(
																"ONLINE",
															)
														}
													/>
												) : whatsappHref ? (
													<PaymentChoice
														selected={
															field.value ===
															"WHATSAPP"
														}
														title="Contact on WhatsApp"
														description="We confirm the order with you in chat, then you pay by mobile money or on delivery."
														onSelect={() =>
															field.onChange(
																"WHATSAPP",
															)
														}
													/>
												) : null}
												<PaymentChoice
													selected={
														field.value ===
														"CASH_ON_DELIVERY"
													}
													title="Pay on delivery"
													description="Pay the rider in cash when the order arrives."
													onSelect={() =>
														field.onChange(
															"CASH_ON_DELIVERY",
														)
													}
												/>
											</div>
										)}
									/>
								</fieldset>

								<div className="mt-10">
									<button
										type="submit"
										disabled={form.formState.isSubmitting}
										className={`${EDITORIAL_BUTTON} w-full disabled:opacity-60 sm:w-fit`}
									>
										<LockKeyholeIcon
											className="size-4"
											strokeWidth={1.75}
										/>
										{form.formState.isSubmitting
											? "Placing order…"
											: submitLabel}
									</button>
									{form.formState.errors.root?.message && (
										<p
											className="mt-4 text-[12.5px] text-destructive"
											role="alert"
										>
											{form.formState.errors.root.message}
										</p>
									)}
								</div>
							</form>
						</Form>
					</div>

					<OrderSummary
						summary={summary}
						items={items}
						title="Your order"
					/>
				</div>
			</EditorialContainer>
		</EditorialShell>
	);
}

interface PaymentChoiceProps {
	selected: boolean;
	title: string;
	description: string;
	onSelect: () => void;
}

/** One payment choice: a hairline row with a radio, title and one line. */
function PaymentChoice({
	selected,
	title,
	description,
	onSelect,
}: PaymentChoiceProps) {
	return (
		<div className="border-border border-b py-5">
			<label className="flex cursor-pointer items-start gap-4">
				<input
					type="radio"
					className="sr-only"
					checked={selected}
					onChange={onSelect}
				/>
				<span
					aria-hidden="true"
					className={cn(
						"mt-0.5 flex size-[18px] shrink-0 items-center justify-center rounded-full border transition-colors",
						selected ? "border-primary" : "border-border",
					)}
				>
					{selected && (
						<span className="size-2 rounded-full bg-primary" />
					)}
				</span>
				<span className="min-w-0 flex-1">
					<span
						className={cn(
							"block font-medium text-[14px]",
							selected ? "text-foreground" : "text-foreground/80",
						)}
					>
						{title}
					</span>
					<span className="mt-1 block text-[11.5px] text-muted-foreground">
						{description}
					</span>
				</span>
			</label>
		</div>
	);
}
