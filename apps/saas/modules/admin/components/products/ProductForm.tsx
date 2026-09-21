"use client";

import { saveStoreProductAction } from "@admin/actions/commerce";
import { ProductOptionsEditor } from "@admin/components/products/ProductOptionsEditor";
import { ProductPhotosField } from "@admin/components/products/ProductPhotosField";
import { ProductPreview } from "@admin/components/products/ProductPreview";
import { ProductSpecificationsField } from "@admin/components/products/ProductSpecificationsField";
import {
	isReadyToPublish,
	productReadiness,
	type SoldAs,
} from "@admin/components/products/product-readiness";
import {
	AdminButton,
	AdminInput,
	AdminSelect,
	AdminSwitch,
	AdminTextarea,
	adminButtonClass,
} from "@admin/components/ui";
import { productSaveStatus } from "@admin/lib/product-save-intent";
import { zodResolver } from "@hookform/resolvers/zod";
import {
	type ProductFormValues,
	productFormSchema,
} from "@repo/api/modules/commerce/types";
import { cn } from "@repo/ui";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@repo/ui/components/form";
import { toastError, toastSuccess } from "@repo/ui/components/toast";
import { ArrowLeftIcon, CheckIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ReactNode, useId, useRef, useState } from "react";
import { useForm } from "react-hook-form";

interface ProductFormProps {
	productId?: string;
	categories: Array<{ id: string; name: string }>;
	defaultValues: ProductFormValues;
}

export const EMPTY_PRODUCT: ProductFormValues = {
	name: "",
	slug: "",
	shortDescription: "",
	description: "",
	brand: "",
	sku: "",
	status: "DRAFT",
	condition: "NEW",
	priceInPesewas: 0,
	compareAtInPesewas: undefined,
	stockQuantity: 0,
	lowStockThreshold: 5,
	isFeatured: false,
	categoryId: "",
	imageUrls: [],
	optionMedia: [],
	specifications: {},
	variants: [],
};

/**
 * A field label with its required mark and hint beside it. The mark and hint
 * sit outside the <label> element on purpose: a label whose text is "Name *"
 * cannot be found as "Name", by a test or by a screen reader's form list.
 */
function Lbl({
	required,
	hint,
	children,
}: {
	required?: boolean;
	hint?: string;
	children: ReactNode;
}) {
	return (
		<div className="flex h-4 flex-wrap items-center gap-2 leading-none">
			<FormLabel className="font-medium text-[13px] text-foreground">
				{children}
			</FormLabel>
			{required && (
				<span
					aria-hidden="true"
					className="font-semibold text-[13px] text-[var(--ed-accent)] leading-none"
				>
					*
				</span>
			)}
			{hint && (
				<span className="text-[12px] text-muted-foreground/80 leading-none">
					{hint}
				</span>
			)}
		</div>
	);
}

/** `iPhone 18 Pro` → `iphone-18-pro` — the slug the field would type itself. */
function slugify(name: string): string {
	return name
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

function Section({
	id,
	title,
	lede,
	children,
}: {
	id: string;
	title: ReactNode;
	lede?: ReactNode;
	children: ReactNode;
}) {
	return (
		<section
			id={id}
			className="scroll-mt-16 border-border border-b py-8 last:border-b-0"
		>
			<div className="mb-5">
				<h2 className="font-semibold text-[17px] tracking-[-0.02em]">
					{title}
				</h2>
				{lede && (
					<p className="mt-1 max-w-[62ch] text-[13px] text-muted-foreground leading-[1.55]">
						{lede}
					</p>
				)}
			</div>
			<div className="grid gap-5">{children}</div>
		</section>
	);
}

/**
 * The product workspace: the form on the left, the shopper's view on the
 * right.
 *
 * Adding a product used to be a drawer over the list — six sections and a
 * variant matrix in a 640px panel. It is a page now, laid out so the
 * questions come in the order an admin can answer them: what it is, what it
 * looks like, how it is sold, then the small print. The preview redraws on
 * every keystroke and the readiness list says exactly what still stands
 * between the product and the storefront.
 */
export function ProductForm({
	productId,
	categories,
	defaultValues,
}: ProductFormProps) {
	const router = useRouter();
	const form = useForm<ProductFormValues>({
		resolver: zodResolver(productFormSchema),
		defaultValues,
	});
	const [soldAs, setSoldAs] = useState<SoldAs>(
		defaultValues.variants.length > 0 ? "options" : "single",
	);
	const [editingSlug, setEditingSlug] = useState(false);
	const featuredId = useId();
	const values = form.watch();
	const readiness = productReadiness(values, soldAs);
	const ready = isReadyToPublish(values, soldAs);
	const leftToDo = readiness.filter((rule) => !rule.ok).length;
	const categoryName = categories.find(
		(category) => category.id === values.categoryId,
	)?.name;
	const wasLive = defaultValues.status === "ACTIVE";
	const activeStock = values.variants
		.filter((variant) => variant.isActive)
		.reduce((total, variant) => total + variant.stockQuantity, 0);

	/**
	 * The slug follows the name until the admin takes it over — edits only
	 * autofill while the field still holds the last suggested value. Existing
	 * products keep their slug stable.
	 */
	const lastAutoSlug = useRef<string | null>(null);
	const maybeAutoSlug = (name: string) => {
		if (productId) {
			return;
		}
		const slug = form.getValues("slug");
		if (slug && slug !== lastAutoSlug.current) {
			return;
		}
		const next = slugify(name);
		lastAutoSlug.current = next;
		form.setValue("slug", next, { shouldDirty: true });
	};

	/**
	 * One save path for every button. A single-version product is stored
	 * without combinations even if some were drafted; a product with options
	 * carries the sum of its on-sale stock at product level, which is what
	 * the list's filters and the low-stock triage read.
	 */
	const submitAs = (status: ProductFormValues["status"]) => {
		form.setValue("status", status, { shouldDirty: true });
		return form.handleSubmit(
			async (raw) => {
				const payload: ProductFormValues =
					soldAs === "single"
						? { ...raw, variants: [], optionMedia: [] }
						: {
								...raw,
								stockQuantity: raw.variants
									.filter((variant) => variant.isActive)
									.reduce(
										(total, variant) =>
											total + variant.stockQuantity,
										0,
									),
							};
				const result = await saveStoreProductAction(payload, productId);

				if (!result.success) {
					toastError("Product not saved", result.message);
					form.setError("root", { message: result.message });
					return;
				}

				toastSuccess(
					productId
						? status === "ACTIVE"
							? "Product updated"
							: "Product updated — saved as a draft"
						: status === "ACTIVE"
							? "Product created — it is live on the shop"
							: "Product created — saved as a draft",
				);
				router.push("/admin/products");
				router.refresh();
			},
			() => {
				toastError(
					"Some fields need attention",
					"The highlighted fields are required before the product can be saved.",
				);
			},
		)();
	};

	const publishLabel = productId
		? "Save changes"
		: values.status === "ARCHIVED"
			? "Save"
			: "Publish";
	const publishStatus = productSaveStatus(values.status, Boolean(productId));
	const publishBlocked = publishStatus === "ACTIVE" && !ready;
	const rootError = form.formState.errors.root?.message;
	const isSubmitting = form.formState.isSubmitting;

	return (
		<Form {...form}>
			<form onSubmit={(event) => event.preventDefault()} noValidate>
				<Link
					href="/admin/products"
					className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground"
				>
					<ArrowLeftIcon className="size-3.5" /> Products
				</Link>

				<div className="mt-3.5 flex flex-wrap items-end justify-between gap-x-8 gap-y-4 border-foreground border-b pb-5">
					<div className="min-w-0">
						<p className="eyebrow mb-3 text-muted-foreground">
							{productId
								? wasLive
									? "Product · Live on the shop"
									: defaultValues.status === "ARCHIVED"
										? "Product · Archived"
										: "Product · Draft"
								: "New product · Draft"}
						</p>
						<h1
							className={cn(
								"truncate font-semibold text-[clamp(26px,2.6vw,34px)] leading-[1.05] tracking-[-0.038em]",
								!values.name && "text-muted-foreground/60",
							)}
						>
							{values.name ||
								(productId
									? "Untitled product"
									: "Add product")}
						</h1>
					</div>
					<div className="flex shrink-0 flex-wrap items-center gap-2">
						<Link
							href="/admin/products"
							className={adminButtonClass("ghost")}
						>
							{productId ? "Discard changes" : "Discard"}
						</Link>
						{!wasLive && (
							<AdminButton
								onClick={() => submitAs("DRAFT")}
								disabled={isSubmitting}
							>
								Save draft
							</AdminButton>
						)}
						<AdminButton
							variant="primary"
							onClick={() => submitAs(publishStatus)}
							disabled={isSubmitting || publishBlocked}
							title={
								publishBlocked
									? `${leftToDo} thing${leftToDo === 1 ? "" : "s"} left before it can go live`
									: undefined
							}
						>
							{isSubmitting ? "Saving…" : publishLabel}
						</AdminButton>
					</div>
				</div>

				<div className="grid items-start gap-12 xl:grid-cols-[minmax(0,1fr)_22.5rem]">
					<div className="min-w-0">
						<nav
							aria-label="Sections"
							className="flex gap-6 border-border border-b"
						>
							{[
								{
									href: "#basics",
									label: "Basics",
									ok: ["basics", "copy"],
								},
								{
									href: "#photos",
									label: "Photos",
									ok: ["photo"],
								},
								{
									href: "#selling",
									label: "Options & pricing",
									ok: [
										"price",
										"stock",
										"options",
										"combos",
										"swatch",
									],
								},
								{
									href: "#specs",
									label: "Specifications",
									ok: [],
								},
							].map((item) => {
								const done = item.ok.every(
									(id) =>
										readiness.find((rule) => rule.id === id)
											?.ok ?? true,
								);
								return (
									<a
										key={item.href}
										href={item.href}
										className="flex h-11 items-center gap-2 text-[13px] text-muted-foreground hover:text-foreground"
									>
										<span
											aria-hidden
											className={cn(
												"size-1.5 rounded-full",
												done
													? "bg-[#1f7a4d]"
													: "bg-muted-foreground/40",
											)}
										/>
										{item.label}
									</a>
								);
							})}
						</nav>

						<Section id="basics" title="Basics">
							<FormField
								control={form.control}
								name="name"
								render={({ field }) => (
									<FormItem>
										<Lbl required>Name</Lbl>
										<FormControl>
											<AdminInput
												placeholder="e.g. Apple Watch Series 11"
												{...field}
												onChange={(event) => {
													field.onChange(event);
													maybeAutoSlug(
														event.target.value,
													);
												}}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="slug"
								render={({ field }) => (
									<FormItem className="-mt-2">
										{editingSlug ? (
											<div className="flex flex-wrap items-center gap-2">
												<FormLabel className="sr-only">
													URL slug
												</FormLabel>
												<span className="text-[12.5px] text-muted-foreground">
													/products/
												</span>
												<FormControl>
													<AdminInput
														inputSize="sm"
														className="w-72 tabular-nums"
														placeholder="apple-watch-series-11"
														{...field}
													/>
												</FormControl>
												<AdminButton
													size="sm"
													onClick={() =>
														setEditingSlug(false)
													}
												>
													Done
												</AdminButton>
											</div>
										) : (
											<p className="text-[12.5px] text-muted-foreground">
												Shop address: /products/
												<b className="text-foreground tabular-nums">
													{field.value || "…"}
												</b>
												{" · "}
												<button
													type="button"
													onClick={() =>
														setEditingSlug(true)
													}
													className="underline underline-offset-[3px] hover:text-foreground"
												>
													Change
												</button>
											</p>
										)}
										<FormMessage />
									</FormItem>
								)}
							/>
							<div className="grid gap-5 sm:grid-cols-3">
								<FormField
									control={form.control}
									name="brand"
									render={({ field }) => (
										<FormItem>
											<Lbl required>Brand</Lbl>
											<FormControl>
												<AdminInput
													placeholder="Apple"
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="categoryId"
									render={({ field }) => (
										<FormItem>
											<Lbl required>Department</Lbl>
											<FormControl>
												<AdminSelect
													value={field.value}
													onValueChange={
														field.onChange
													}
													placeholder="Choose…"
													aria-label="Department"
													options={categories.map(
														(category) => ({
															value: category.id,
															label: category.name,
														}),
													)}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="condition"
									render={({ field }) => (
										<FormItem>
											<Lbl>Condition</Lbl>
											<FormControl>
												<AdminSelect
													value={field.value}
													onValueChange={
														field.onChange
													}
													aria-label="Condition"
													options={[
														{
															value: "NEW",
															label: "New",
														},
														{
															value: "REFURBISHED",
															label: "Refurbished",
														},
														{
															value: "USED",
															label: "Used",
														},
													]}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
							<FormField
								control={form.control}
								name="shortDescription"
								render={({ field }) => (
									<FormItem>
										<Lbl
											required
											hint="one line, shown on product cards"
										>
											Summary
										</Lbl>
										<FormControl>
											<AdminInput
												placeholder="One sentence a shopper reads on the card"
												maxLength={200}
												{...field}
											/>
										</FormControl>
										<p
											className={cn(
												"text-[12px] tabular-nums",
												field.value.length > 180
													? "text-destructive"
													: "text-muted-foreground",
											)}
										>
											{field.value.length} / 180
										</p>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="description"
								render={({ field }) => (
									<FormItem>
										<Lbl required>Description</Lbl>
										<FormControl>
											<AdminTextarea
												rows={6}
												placeholder="What should a customer know before buying?"
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</Section>

						<Section
							id="photos"
							title="Photos"
							lede="The first one is the cover — it's what shows on cards, in search and in the bag. Photos for a specific colour are set under Options, in “Photos for each colour”."
						>
							<FormField
								control={form.control}
								name="imageUrls"
								render={({ field }) => (
									<FormItem>
										<ProductPhotosField
											value={field.value}
											onChange={field.onChange}
										/>
										<FormMessage />
									</FormItem>
								)}
							/>
						</Section>

						<Section
							id="selling"
							title="How is it sold?"
							lede="Does a shopper have to choose anything — a colour, a size — before buying? You can change your mind without losing what you typed."
						>
							<div
								role="radiogroup"
								aria-label="How is it sold"
								className="grid gap-3 sm:grid-cols-2"
							>
								{(
									[
										{
											value: "single",
											title: "One version",
											detail: "A single price and a single stock count. Most accessories, cables and cases.",
										},
										{
											value: "options",
											title: "Comes in options",
											detail: "Colour, size, storage… Each combination gets its own price, stock and SKU.",
										},
									] as const
								).map((choice) => {
									const on = soldAs === choice.value;
									return (
										<label
											key={choice.value}
											className={cn(
												"relative flex cursor-pointer items-start gap-3 rounded-[2px] border bg-white p-4 text-left transition-colors focus-within:ring-2 focus-within:ring-foreground focus-within:ring-offset-2 hover:border-foreground",
												on
													? "border-foreground ring-1 ring-foreground"
													: "border-border",
											)}
										>
											<input
												type="radio"
												name="soldAs"
												value={choice.value}
												checked={on}
												onChange={() =>
													setSoldAs(choice.value)
												}
												className="absolute inset-0 size-full cursor-pointer appearance-none opacity-0"
											/>
											<span
												aria-hidden
												className={cn(
													"mt-0.5 grid size-4 shrink-0 place-items-center rounded-full border",
													on
														? "border-foreground"
														: "border-border",
												)}
											>
												{on && (
													<span className="size-2 rounded-full bg-foreground" />
												)}
											</span>
											<span>
												<span className="block font-semibold text-[13.5px]">
													{choice.title}
												</span>
												<span className="mt-0.5 block text-[12.5px] text-muted-foreground leading-[1.5]">
													{choice.detail}
												</span>
											</span>
										</label>
									);
								})}
							</div>

							<div className="grid gap-5 sm:grid-cols-3">
								<FormField
									control={form.control}
									name="priceInPesewas"
									render={({ field }) => (
										<FormItem>
											<Lbl required>
												{soldAs === "options"
													? "Starting price (GH₵)"
													: "Price (GH₵)"}
											</Lbl>
											<FormControl>
												<AdminInput
													type="number"
													min="0"
													step="0.01"
													placeholder="0.00"
													className="tabular-nums"
													name={field.name}
													value={
														field.value
															? field.value / 100
															: ""
													}
													onChange={(event) =>
														field.onChange(
															Math.round(
																Number(
																	event.target
																		.value,
																) * 100,
															),
														)
													}
												/>
											</FormControl>
											{soldAs === "options" && (
												<p className="text-[12px] text-muted-foreground">
													Every combination begins
													here.
												</p>
											)}
											<FormMessage />
										</FormItem>
									)}
								/>
								{soldAs === "single" && (
									<FormField
										control={form.control}
										name="compareAtInPesewas"
										render={({ field }) => (
											<FormItem>
												<Lbl hint="optional">
													Was price (GH₵)
												</Lbl>
												<FormControl>
													<AdminInput
														type="number"
														min="0"
														step="0.01"
														placeholder="0.00"
														className="tabular-nums"
														name={field.name}
														value={
															field.value
																? field.value /
																	100
																: ""
														}
														onChange={(event) =>
															field.onChange(
																event.target
																	.value
																	? Math.round(
																			Number(
																				event
																					.target
																					.value,
																			) *
																				100,
																		)
																	: undefined,
															)
														}
													/>
												</FormControl>
												<p className="text-[12px] text-muted-foreground">
													Shown struck through beside
													the price.
												</p>
												<FormMessage />
											</FormItem>
										)}
									/>
								)}
								<FormField
									control={form.control}
									name="sku"
									render={({ field }) => (
										<FormItem>
											<Lbl required>
												{soldAs === "options"
													? "Base product code (SKU)"
													: "Product code (SKU)"}
											</Lbl>
											<FormControl>
												<AdminInput
													placeholder="GST-APL-AWS11"
													className="tabular-nums"
													{...field}
												/>
											</FormControl>
											{soldAs === "options" && (
												<p className="text-[12px] text-muted-foreground">
													Combinations add their own
													suffix.
												</p>
											)}
											<FormMessage />
										</FormItem>
									)}
								/>
								{soldAs === "single" && (
									<FormField
										control={form.control}
										name="stockQuantity"
										render={({ field }) => (
											<FormItem>
												<Lbl required>In stock</Lbl>
												<FormControl>
													<AdminInput
														type="number"
														min="0"
														step="1"
														className="tabular-nums"
														{...field}
														onChange={(event) =>
															field.onChange(
																Number(
																	event.target
																		.value,
																),
															)
														}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								)}
								<FormField
									control={form.control}
									name="lowStockThreshold"
									render={({ field }) => (
										<FormItem>
											<Lbl>Low-stock warning at</Lbl>
											<FormControl>
												<AdminInput
													type="number"
													min="0"
													step="1"
													className="tabular-nums"
													{...field}
													onChange={(event) =>
														field.onChange(
															Number(
																event.target
																	.value,
															),
														)
													}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

							{soldAs === "options" && (
								<>
									<ProductOptionsEditor form={form} />
									{values.variants.length > 0 && (
										<p className="text-[12px] text-muted-foreground tabular-nums">
											Stock across combinations on sale:{" "}
											<b className="text-foreground">
												{activeStock}
											</b>
											. That is the figure the product
											list and low-stock warnings use.
										</p>
									)}
								</>
							)}
						</Section>

						<Section
							id="specs"
							title={
								<>
									Specifications{" "}
									<span className="font-normal text-[13px] text-muted-foreground/80">
										optional
									</span>
								</>
							}
							lede="The comparison table on the product page. Add what a buyer would compare."
						>
							<FormField
								control={form.control}
								name="specifications"
								render={({ field }) => (
									<FormItem>
										<ProductSpecificationsField
											value={field.value}
											onChange={field.onChange}
										/>
										<FormMessage />
									</FormItem>
								)}
							/>
						</Section>

						{rootError && (
							<p
								className="text-[13px] text-destructive"
								role="alert"
							>
								{rootError}
							</p>
						)}
					</div>

					<aside className="grid gap-7 pt-4 xl:sticky xl:top-6">
						<div>
							<p className="eyebrow mb-3 text-muted-foreground">
								Shopper&apos;s view
							</p>
							<ProductPreview
								values={values}
								soldAs={soldAs}
								categoryName={categoryName}
							/>
						</div>

						<div>
							<p className="eyebrow mb-3 flex items-baseline justify-between text-muted-foreground">
								<span>Before it can go live</span>
								<span className="text-foreground tabular-nums">
									{readiness.length - leftToDo} /{" "}
									{readiness.length}
								</span>
							</p>
							<ul className="grid gap-2" aria-label="Readiness">
								{readiness.map((rule) => (
									<li
										key={rule.id}
										className={cn(
											"flex items-center gap-2.5 text-[13px]",
											rule.ok
												? "text-foreground"
												: "text-muted-foreground",
										)}
									>
										<span
											aria-hidden
											className={cn(
												"grid size-4 shrink-0 place-items-center rounded-full border",
												rule.ok
													? "border-foreground bg-foreground text-background"
													: "border-border",
											)}
										>
											{rule.ok && (
												<CheckIcon className="size-2.5" />
											)}
										</span>
										<span className="min-w-0 flex-1">
											{rule.label}
										</span>
										{rule.ok ? (
											rule.detail ? (
												<span className="text-[12px] text-muted-foreground/70 tabular-nums">
													{rule.detail}
												</span>
											) : null
										) : (
											<a
												href={rule.anchor}
												className="text-[12px] underline underline-offset-[3px] hover:text-foreground"
											>
												fix
											</a>
										)}
									</li>
								))}
							</ul>
							<p className="mt-3 text-[12px] text-muted-foreground leading-[1.55]">
								{leftToDo
									? `Publish unlocks when the list is complete — ${leftToDo} to go. Save a draft any time.`
									: "Everything is in place. Publish when you are ready."}
							</p>
						</div>

						<div className="grid gap-4">
							<p className="eyebrow text-muted-foreground">
								Visibility
							</p>
							<FormField
								control={form.control}
								name="status"
								render={({ field }) => (
									<FormItem>
										<Lbl>Status</Lbl>
										<FormControl>
											<AdminSelect
												value={field.value}
												onValueChange={field.onChange}
												aria-label="Status"
												options={[
													{
														value: "DRAFT",
														label: "Draft — hidden from shop",
													},
													{
														value: "ACTIVE",
														label: "Active — on the shop",
													},
													{
														value: "ARCHIVED",
														label: "Archived",
													},
												]}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="isFeatured"
								render={({ field }) => (
									<FormItem>
										<div className="flex items-center gap-3 text-[13.5px]">
											<AdminSwitch
												id={featuredId}
												checked={field.value}
												onCheckedChange={field.onChange}
											/>
											<label
												htmlFor={featuredId}
												className="cursor-pointer"
											>
												Featured on the home page
											</label>
										</div>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
					</aside>
				</div>
			</form>
		</Form>
	);
}
