"use client";

import { placeMockOrderAction } from "@commerce/actions/checkout";
import { useCart } from "@commerce/components/CartProvider";
import { formatMoney } from "@commerce/lib/money";
import {
	createMockOrder,
	MOCK_ORDERS_STORAGE_KEY,
	type MockOrder,
} from "@commerce/lib/order";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@repo/ui/components/button";
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
	ArrowLeftIcon,
	BadgeCheckIcon,
	CreditCardIcon,
	LockKeyholeIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

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

function createOrderToken(): string {
	return Math.random().toString(36).slice(2, 6).padEnd(4, "0");
}

export function CheckoutForm({ prefill = {} }: { prefill?: CheckoutPrefill }) {
	const { items, summary, isHydrated, clearCart } = useCart();
	const router = useRouter();
	const isCompletingCheckout = useRef(false);
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
		},
	});

	useEffect(() => {
		if (isHydrated && items.length === 0 && !isCompletingCheckout.current) {
			router.replace("/cart");
		}
	}, [isHydrated, items.length, router]);

	const onSubmit = form.handleSubmit(async (values) => {
		isCompletingCheckout.current = true;
		const result = await placeMockOrderAction({
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
				quantity: item.quantity,
			})),
			customerNote: values.note || undefined,
		});

		if (!result.success || !result.order) {
			isCompletingCheckout.current = false;
			form.setError("root", {
				message:
					result.message ??
					"We couldn’t place the order. Please try again.",
			});
			return;
		}

		const order = createMockOrder({
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
			items,
			now: new Date(result.order.placedAt),
			orderToken: createOrderToken(),
		});
		order.id = result.order.orderNumber;

		window.localStorage.setItem(
			MOCK_ORDERS_STORAGE_KEY,
			JSON.stringify([order, ...readOrders()]),
		);
		clearCart();
		router.push(`/checkout/success?order=${encodeURIComponent(order.id)}`);
	});

	if (!isHydrated || items.length === 0) {
		return (
			<div className="container py-12" aria-busy="true">
				<div className="h-[32rem] animate-pulse rounded-2xl bg-muted" />
			</div>
		);
	}

	return (
		<div className="container py-8 lg:py-12">
			<Link
				href="/cart"
				className="inline-flex items-center gap-2 text-muted-foreground text-sm hover:text-foreground"
			>
				<ArrowLeftIcon className="size-4" /> Back to bag
			</Link>

			<div className="mt-5 grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-14">
				<div>
					<div className="border-b pb-6">
						<p className="font-semibold text-primary text-sm">
							Secure mock checkout · Step 1 of 1
						</p>
						<h1 className="mt-2 font-brand font-semibold text-4xl tracking-tight sm:text-5xl">
							Where should we deliver?
						</h1>
						<p className="mt-3 max-w-2xl text-muted-foreground leading-7">
							Enter accurate contact and delivery details. This
							checkout is a product demo and will not charge you.
						</p>
					</div>

					<Form {...form}>
						<form
							onSubmit={onSubmit}
							className="mt-8 space-y-9"
							noValidate
						>
							<fieldset>
								<legend className="font-semibold text-xl">
									Contact details
								</legend>
								<p className="mt-1 text-muted-foreground text-sm">
									We use these details for the order receipt
									and delivery updates.
								</p>
								<div className="mt-5 grid gap-5 sm:grid-cols-2">
									<FormField
										control={form.control}
										name="name"
										render={({ field }) => (
											<FormItem className="sm:col-span-2">
												<FormLabel>Full name</FormLabel>
												<FormControl>
													<Input
														autoComplete="name"
														placeholder="Abena Mensah"
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
												<FormLabel>
													Email address
												</FormLabel>
												<FormControl>
													<Input
														type="email"
														autoComplete="email"
														placeholder="abena@example.com"
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
												<FormLabel>
													Phone number
												</FormLabel>
												<FormControl>
													<Input
														type="tel"
														autoComplete="tel"
														placeholder="+233 24 555 0192"
														{...field}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>
							</fieldset>

							<fieldset className="border-t pt-8">
								<legend className="font-semibold text-xl">
									Delivery address
								</legend>
								<div className="mt-5 grid gap-5 sm:grid-cols-2">
									<FormField
										control={form.control}
										name="line1"
										render={({ field }) => (
											<FormItem className="sm:col-span-2">
												<FormLabel>
													Street address or landmark
												</FormLabel>
												<FormControl>
													<Input
														autoComplete="address-line1"
														placeholder="14 Independence Avenue"
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
												<FormLabel>
													Apartment, floor, or
													additional directions{" "}
													<span className="font-normal text-muted-foreground">
														(optional)
													</span>
												</FormLabel>
												<FormControl>
													<Input
														autoComplete="address-line2"
														placeholder="Second floor, blue gate"
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
												<FormLabel>
													Town or city
												</FormLabel>
												<FormControl>
													<Input
														autoComplete="address-level2"
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
												<FormLabel>Region</FormLabel>
												<FormControl>
													<Input
														autoComplete="address-level1"
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
												<FormLabel>
													Delivery note{" "}
													<span className="font-normal text-muted-foreground">
														(optional)
													</span>
												</FormLabel>
												<FormControl>
													<Textarea
														rows={3}
														placeholder="A useful landmark or preferred call instructions"
														{...field}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>
							</fieldset>

							<fieldset className="border-t pt-8">
								<legend className="font-semibold text-xl">
									Payment
								</legend>
								<div className="mt-5 flex items-start gap-4 rounded-2xl border-2 border-primary bg-primary/5 p-5">
									<span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
										<CreditCardIcon className="size-5" />
									</span>
									<div className="min-w-0">
										<div className="flex items-center gap-2">
											<p className="font-semibold">
												Mock payment
											</p>
											<BadgeCheckIcon className="size-4 text-primary" />
										</div>
										<p className="mt-1 text-muted-foreground text-sm leading-6">
											The order will be marked paid for
											testing. No card, mobile money
											number, or real funds are used.
										</p>
									</div>
								</div>
							</fieldset>

							<Button
								type="submit"
								size="lg"
								className="h-12 w-full sm:w-auto"
								disabled={form.formState.isSubmitting}
							>
								<LockKeyholeIcon className="size-4" />{" "}
								{form.formState.isSubmitting
									? "Placing order..."
									: `Place mock order · ${formatMoney(summary.totalInPesewas)}`}
							</Button>
							{form.formState.errors.root?.message && (
								<p
									className="text-destructive text-sm"
									role="alert"
								>
									{form.formState.errors.root.message}
								</p>
							)}
						</form>
					</Form>
				</div>

				<aside className="rounded-2xl bg-muted/55 p-5 lg:sticky lg:top-40">
					<h2 className="font-semibold text-lg">Your order</h2>
					<div className="mt-5 space-y-4 border-b pb-5">
						{items.map((item) => (
							<div
								key={item.productId}
								className="grid grid-cols-[3.5rem_1fr_auto] gap-3"
							>
								<div className="relative aspect-square overflow-hidden rounded-lg bg-background">
									<Image
										src={item.imageUrl}
										alt=""
										fill
										sizes="56px"
										className="object-cover"
									/>
								</div>
								<div className="min-w-0">
									<p className="truncate font-medium text-sm">
										{item.name}
									</p>
									<p className="mt-1 text-muted-foreground text-xs">
										Qty {item.quantity}
									</p>
								</div>
								<p className="font-medium text-sm tabular-nums">
									{formatMoney(
										item.priceInPesewas * item.quantity,
									)}
								</p>
							</div>
						))}
					</div>
					<div className="space-y-3 border-b py-5 text-sm">
						<div className="flex justify-between">
							<span className="text-muted-foreground">
								Subtotal
							</span>
							<span className="tabular-nums">
								{formatMoney(summary.subtotalInPesewas)}
							</span>
						</div>
						<div className="flex justify-between">
							<span className="text-muted-foreground">
								Delivery
							</span>
							<span>
								{summary.deliveryInPesewas === 0
									? "Free"
									: formatMoney(summary.deliveryInPesewas)}
							</span>
						</div>
					</div>
					<div className="flex items-end justify-between gap-4 pt-5">
						<span className="font-semibold">Total</span>
						<span className="font-semibold text-xl tabular-nums">
							{formatMoney(summary.totalInPesewas)}
						</span>
					</div>
				</aside>
			</div>
		</div>
	);
}
