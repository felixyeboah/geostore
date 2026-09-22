"use client";

import { saveStoreProductAction } from "@admin/actions/commerce";
import { Lbl, Section } from "@admin/components/products/form-primitives";
import { ProductBasicsSection } from "@admin/components/products/ProductBasicsSection";
import { ProductPhotosField } from "@admin/components/products/ProductPhotosField";
import { ProductPreview } from "@admin/components/products/ProductPreview";
import { ProductSellingSection } from "@admin/components/products/ProductSellingSection";
import { ProductSpecificationsField } from "@admin/components/products/ProductSpecificationsField";
import {
	isReadyToPublish,
	productReadiness,
	type SoldAs,
} from "@admin/components/products/product-readiness";
import {
	AdminButton,
	AdminSelect,
	AdminSwitch,
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
	FormMessage,
} from "@repo/ui/components/form";
import { toastError, toastSuccess } from "@repo/ui/components/toast";
import { ArrowLeftIcon, CheckIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useRef, useState } from "react";
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

/** `iPhone 18 Pro` → `iphone-18-pro` — the slug the field would type itself. */
function slugify(name: string): string {
	return name
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
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
	const [soldAs, setSoldAs] = useState<SoldAs>(
		defaultValues.variants.length > 0 ? "options" : "single",
	);
	/**
	 * The resolver sees what will be saved, not what is on screen: drafted
	 * combinations stay in state so "Comes in options" can restore them, but
	 * they cannot block a "One version" save with errors on hidden fields.
	 */
	const soldAsRef = useRef(soldAs);
	soldAsRef.current = soldAs;
	const form = useForm<ProductFormValues>({
		resolver: (values, context, options) =>
			zodResolver(productFormSchema)(
				soldAsRef.current === "single"
					? { ...values, variants: [], optionMedia: [] }
					: values,
				context,
				options,
			),
		defaultValues,
	});
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
	 * without combinations even if some were drafted; for a product with
	 * options the server re-derives the on-sale stock total from the rows.
	 */
	const submitAs = (status: ProductFormValues["status"]) => {
		form.setValue("status", status, { shouldDirty: true });
		return form.handleSubmit(
			async (raw) => {
				const payload: ProductFormValues =
					soldAs === "single"
						? { ...raw, variants: [], optionMedia: [] }
						: raw;
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
								{ href: "#basics", label: "Basics" },
								{ href: "#photos", label: "Photos" },
								{
									href: "#selling",
									label: "Options & pricing",
								},
								{ href: "#specs", label: "Specifications" },
							].map((item) => {
								// A section is done when every readiness rule
								// anchored to it is — specifications has none.
								const done = readiness
									.filter((rule) => rule.anchor === item.href)
									.every((rule) => rule.ok);
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

						<ProductBasicsSection
							form={form}
							categories={categories}
							onNameInput={maybeAutoSlug}
						/>

						<Section
							id="photos"
							title="Photos"
							lede="Add general product photos here, or set photos for each active colour under Options. The selected option’s photos appear in the bag and order; general photos are the fallback."
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

						<ProductSellingSection
							form={form}
							soldAs={soldAs}
							onSoldAsChange={setSoldAs}
							activeStock={activeStock}
						/>

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
