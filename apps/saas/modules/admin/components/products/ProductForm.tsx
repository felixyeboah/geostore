"use client";

import { saveStoreProductAction } from "@admin/actions/commerce";
import { ProductImagesField } from "@admin/components/products/ProductImagesField";
import {
	AdminButton,
	AdminCheckbox,
	AdminCombobox,
	AdminInput,
	AdminSelect,
	AdminTextarea,
} from "@admin/components/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import {
	type ProductFormValues,
	productFormSchema,
} from "@repo/api/modules/commerce/types";
import {
	COMMON_OPTION_AXES,
	isColourAxis,
	isHexColour,
	OPTION_VALUE_SUGGESTIONS,
} from "@repo/commerce";
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
import { ArrowLeftIcon, SaveIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useForm } from "react-hook-form";

interface ProductFormProps {
	productId?: string;
	categories: Array<{ id: string; name: string }>;
	defaultValues: ProductFormValues;
	/**
	 * `page` keeps the two-column editor with its own heading. `sheet` stacks
	 * the same sections into a scrolling column with the actions pinned to the
	 * bottom, for the create-in-place drawer on the products screen.
	 */
	variant?: "page" | "sheet";
	/** Runs after a successful save instead of navigating to the list. */
	onSaved?: () => void;
	/** Renders a cancel action beside Save. Only used by the sheet. */
	onCancel?: () => void;
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

function specificationsToText(specifications: Record<string, string>): string {
	return Object.entries(specifications)
		.map(([label, value]) => `${label}: ${value}`)
		.join("\n");
}

function textToSpecifications(value: string): Record<string, string> {
	return Object.fromEntries(
		value
			.split("\n")
			.map((line) => line.trim())
			.filter(Boolean)
			.map((line) => {
				const separatorIndex = line.indexOf(":");
				return separatorIndex > 0
					? [
							line.slice(0, separatorIndex).trim(),
							line.slice(separatorIndex + 1).trim(),
						]
					: [line, ""];
			}),
	);
}

function FormSection({
	title,
	action,
	hint,
	children,
}: {
	title: string;
	action?: ReactNode;
	hint?: string;
	children: ReactNode;
}) {
	return (
		<section className="border-border border-t pt-7 first:border-t-0 first:pt-0">
			<div className="flex items-center justify-between gap-3">
				<h2 className="eyebrow text-muted-foreground">{title}</h2>
				{action}
			</div>
			{hint && (
				<p className="mt-2 text-muted-foreground text-sm">{hint}</p>
			)}
			<div className="mt-5 grid gap-5">{children}</div>
		</section>
	);
}

const LABEL = "eyebrow text-muted-foreground";

export function ProductForm({
	productId,
	categories,
	defaultValues,
	variant = "page",
	onSaved,
	onCancel,
}: ProductFormProps) {
	const router = useRouter();
	const isSheet = variant === "sheet";
	const form = useForm<ProductFormValues>({
		resolver: zodResolver(productFormSchema),
		defaultValues,
	});
	const specificationsText = specificationsToText(
		form.watch("specifications"),
	);
	const watchedVariants = form.watch("variants");
	const watchedOptionMedia = form.watch("optionMedia") ?? [];

	/**
	 * The axes and values the variants actually use — the option-media
	 * comboboxes offer them first so a gallery never drifts from a stray
	 * retyping. Free text still works; save-time normalisation keys media
	 * and attributes the same way.
	 */
	const axisSuggestions = [
		...new Map(
			[
				...COMMON_OPTION_AXES,
				...watchedVariants.flatMap((variant) =>
					Object.keys(variant.attributes ?? {}),
				),
			]
				.map((axis) => axis.trim())
				.filter(Boolean)
				.map((axis) => [axis.toLowerCase(), axis] as const),
		).values(),
	];
	const optionValueSuggestions = (axis: string) => {
		const lower = axis.trim().toLowerCase();
		const used = watchedVariants.flatMap((variant) =>
			Object.entries(variant.attributes ?? {})
				.filter(([key]) => key.trim().toLowerCase() === lower)
				.map(([, value]) => value.trim()),
		);
		return [
			...new Set([...used, ...(OPTION_VALUE_SUGGESTIONS[lower] ?? [])]),
		].filter(Boolean);
	};

	const setOptionMedia = (
		index: number,
		patch: Partial<ProductFormValues["optionMedia"][number]>,
	) => {
		const rows = [...(form.getValues("optionMedia") ?? [])];
		rows[index] = { ...rows[index], ...patch };
		form.setValue("optionMedia", rows, { shouldDirty: true });
	};

	const variantAttributesPath = (index: number) =>
		`variants.${index}.attributes` as const;

	/** Renames an option row or edits its value, keeping row order stable. */
	const setVariantAttribute = (
		variantIndex: number,
		attributeKey: string,
		nextKey: string,
		nextValue: string,
	) => {
		const path = variantAttributesPath(variantIndex);
		const next: Record<string, string> = {};
		for (const [key, value] of Object.entries(form.getValues(path) ?? {})) {
			next[key === attributeKey ? nextKey : key] =
				key === attributeKey ? nextValue : value;
		}
		form.setValue(path, next, { shouldDirty: true });
	};

	const addVariantAttribute = (variantIndex: number) => {
		const path = variantAttributesPath(variantIndex);
		const current = form.getValues(path) ?? {};
		// One blank row at a time — an empty key is the "new row" slot.
		if ("" in current) {
			return;
		}
		form.setValue(path, { ...current, "": "" }, { shouldDirty: true });
	};

	const removeVariantAttribute = (
		variantIndex: number,
		attributeKey: string,
	) => {
		const path = variantAttributesPath(variantIndex);
		const next = { ...(form.getValues(path) ?? {}) };
		delete next[attributeKey];
		form.setValue(path, next, { shouldDirty: true });
	};

	const onSubmit = form.handleSubmit(async (values) => {
		const result = await saveStoreProductAction(values, productId);

		if (!result.success) {
			toastError("Product not saved", result.message);
			form.setError("root", { message: result.message });
			return;
		}

		toastSuccess(productId ? "Product updated" : "Product created");

		if (onSaved) {
			form.reset(EMPTY_PRODUCT);
			onSaved();
			router.refresh();
			return;
		}

		router.push("/admin/products");
		router.refresh();
	});

	const detailsSection = (
		<FormSection title="Product information">
			<div className="grid gap-5 sm:grid-cols-2">
				<FormField
					control={form.control}
					name="name"
					render={({ field }) => (
						<FormItem>
							<FormLabel className={LABEL}>Name</FormLabel>
							<FormControl>
								<AdminInput
									placeholder="iPhone 15 Pro"
									{...field}
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
						<FormItem>
							<FormLabel className={LABEL}>URL slug</FormLabel>
							<FormControl>
								<AdminInput
									placeholder="iphone-15-pro"
									{...field}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="brand"
					render={({ field }) => (
						<FormItem>
							<FormLabel className={LABEL}>Brand</FormLabel>
							<FormControl>
								<AdminInput placeholder="Apple" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="sku"
					render={({ field }) => (
						<FormItem>
							<FormLabel className={LABEL}>SKU</FormLabel>
							<FormControl>
								<AdminInput
									placeholder="GST-APL-IP15P-256"
									{...field}
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
							<FormLabel className={LABEL}>Condition</FormLabel>
							<FormControl>
								<AdminSelect
									value={field.value}
									onValueChange={field.onChange}
									aria-label="Condition"
									options={[
										{ value: "NEW", label: "New" },
										{ value: "USED", label: "Used" },
										{
											value: "REFURBISHED",
											label: "Refurbished",
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
					name="shortDescription"
					render={({ field }) => (
						<FormItem className="sm:col-span-2">
							<FormLabel className={LABEL}>
								Short description
							</FormLabel>
							<FormControl>
								<AdminTextarea
									rows={2}
									placeholder="A concise summary for product cards."
									{...field}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="description"
					render={({ field }) => (
						<FormItem className="sm:col-span-2">
							<FormLabel className={LABEL}>
								Full description
							</FormLabel>
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
			</div>
		</FormSection>
	);

	const mediaSection = (
		<FormSection title="Images and specifications">
			<FormField
				control={form.control}
				name="imageUrls"
				render={({ field }) => (
					<FormItem>
						{/*
						 * A plain label rather than FormLabel: this field is a
						 * drop area and a list, not one control, so an htmlFor
						 * would point at nothing. The dropzone's own input
						 * carries the accessible name.
						 */}
						<span className={LABEL}>Images</span>
						<ProductImagesField
							value={field.value}
							onChange={field.onChange}
						/>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name="specifications"
				render={({ field }) => (
					<FormItem>
						<FormLabel className={LABEL}>Specifications</FormLabel>
						<FormControl>
							<AdminTextarea
								rows={6}
								value={specificationsText}
								onChange={(event) =>
									field.onChange(
										textToSpecifications(
											event.target.value,
										),
									)
								}
								placeholder="Storage: 256 GB&#10;Warranty: 12 months"
							/>
						</FormControl>
						<p className="text-muted-foreground text-xs">
							Use one “Label: Value” specification per line.
						</p>
						<FormMessage />
					</FormItem>
				)}
			/>
		</FormSection>
	);

	const variantsSection = (
		<FormSection
			title="Variants"
			hint="One row per combination a shopper can pick — e.g. Colour: Black plus Size: 256 GB. The name can stay blank; the option values become the label."
			action={
				<AdminButton
					size="sm"
					onClick={() =>
						form.setValue("variants", [
							...form.getValues("variants"),
							{
								name: "",
								sku: "",
								priceInPesewas:
									form.getValues("priceInPesewas") || 100,
								stockQuantity: 0,
								attributes: {},
								isActive: true,
							},
						])
					}
				>
					Add variant
				</AdminButton>
			}
		>
			{form.watch("variants").map((variant, index) => (
				<div
					key={variant.id ?? `new-${index}`}
					data-testid={`variant-${index}`}
					className="grid gap-5 border-border border-t pt-5 first:border-t-0 first:pt-0 sm:grid-cols-2"
				>
					<FormField
						control={form.control}
						name={`variants.${index}.name`}
						render={({ field }) => (
							<FormItem>
								<FormLabel className={LABEL}>
									Name (optional)
								</FormLabel>
								<FormControl>
									<AdminInput
										placeholder="Uses the option values"
										{...field}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name={`variants.${index}.sku`}
						render={({ field }) => (
							<FormItem>
								<FormLabel className={LABEL}>SKU</FormLabel>
								<FormControl>
									<AdminInput {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name={`variants.${index}.priceInPesewas`}
						render={({ field }) => (
							<FormItem>
								<FormLabel className={LABEL}>
									Price (GH₵)
								</FormLabel>
								<FormControl>
									<AdminInput
										type="number"
										min="0"
										step="0.01"
										name={field.name}
										value={field.value / 100}
										onChange={(event) =>
											field.onChange(
												Math.round(
													Number(event.target.value) *
														100,
												),
											)
										}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name={`variants.${index}.stockQuantity`}
						render={({ field }) => (
							<FormItem>
								<FormLabel className={LABEL}>Stock</FormLabel>
								<FormControl>
									<AdminInput
										type="number"
										min="0"
										{...field}
										onChange={(event) =>
											field.onChange(
												Number(event.target.value),
											)
										}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<div className="sm:col-span-2">
						<p className={LABEL}>Options</p>
						<ul className="mt-3 space-y-2">
							{Object.entries(variant.attributes ?? {}).map(
								([attributeKey, attributeValue], pairIndex) => {
									const usedAxes = Object.keys(
										variant.attributes ?? {},
									);
									return (
										<li
											key={pairIndex}
											className="flex items-center gap-2"
										>
											<AdminCombobox
												inputSize="sm"
												aria-label="Option name"
												placeholder="Colour"
												className="w-40"
												value={attributeKey}
												suggestions={COMMON_OPTION_AXES.filter(
													(axis) =>
														!usedAxes.includes(
															axis,
														) ||
														axis === attributeKey,
												)}
												onValueChange={(nextKey) =>
													setVariantAttribute(
														index,
														attributeKey,
														nextKey,
														attributeValue,
													)
												}
											/>
											<AdminCombobox
												inputSize="sm"
												aria-label="Option value"
												placeholder="Black"
												value={attributeValue}
												suggestions={
													OPTION_VALUE_SUGGESTIONS[
														attributeKey
															.trim()
															.toLowerCase()
													] ?? []
												}
												onValueChange={(nextValue) =>
													setVariantAttribute(
														index,
														attributeKey,
														attributeKey,
														nextValue,
													)
												}
											/>
											<button
												type="button"
												aria-label={`Remove ${attributeKey || "option"}`}
												className="px-1 text-lg text-muted-foreground leading-none hover:text-destructive"
												onClick={() =>
													removeVariantAttribute(
														index,
														attributeKey,
													)
												}
											>
												×
											</button>
										</li>
									);
								},
							)}
						</ul>
						<button
							type="button"
							className="mt-2 text-primary text-sm"
							onClick={() => addVariantAttribute(index)}
						>
							+ Add option
						</button>
					</div>
					<button
						type="button"
						className="text-left text-destructive text-sm sm:col-span-2"
						onClick={() =>
							form.setValue(
								"variants",
								form
									.getValues("variants")
									.filter(
										(_, itemIndex) => itemIndex !== index,
									),
							)
						}
					>
						Remove variant
					</button>
				</div>
			))}
		</FormSection>
	);

	const optionMediaSection = (
		<FormSection
			title="Option media"
			hint="Give an option value its own photos and swatch — pick a value the variants use, or enter a new one. Colour values can carry a hex; every value can carry its own image gallery."
			action={
				<AdminButton
					size="sm"
					onClick={() =>
						form.setValue(
							"optionMedia",
							[
								...watchedOptionMedia,
								{ axis: "", value: "", hex: "", images: [] },
							],
							{ shouldDirty: true },
						)
					}
				>
					Add option media
				</AdminButton>
			}
		>
			{watchedOptionMedia.length === 0 ? (
				<p className="text-muted-foreground text-sm">
					No option media yet. Add variants first, then attach photos
					or a swatch to a value like “Colour: Black”.
				</p>
			) : (
				<ul className="grid gap-4">
					{watchedOptionMedia.map((media, index) => (
						<li
							key={index}
							data-testid={`option-media-${index}`}
							className="grid gap-4 rounded-[2px] border border-border p-4"
						>
							<div className="flex flex-wrap items-center gap-2">
								<AdminCombobox
									inputSize="sm"
									aria-label="Option name"
									placeholder="Colour"
									className="w-40"
									value={media.axis}
									suggestions={axisSuggestions}
									onValueChange={(axis) =>
										setOptionMedia(index, { axis })
									}
								/>
								<AdminCombobox
									inputSize="sm"
									aria-label="Option value"
									placeholder="Black"
									value={media.value}
									suggestions={optionValueSuggestions(
										media.axis,
									)}
									onValueChange={(value) =>
										setOptionMedia(index, { value })
									}
								/>
								{isColourAxis(media.axis) ? (
									<FormField
										control={form.control}
										name={`optionMedia.${index}.hex`}
										render={({ field }) => (
											<FormItem className="flex items-center gap-2 space-y-0">
												<span
													aria-hidden
													className="size-6 rounded-full border border-black/15"
													style={{
														backgroundColor:
															field.value &&
															isHexColour(
																field.value,
															)
																? field.value
																: "transparent",
													}}
												/>
												<FormControl>
													<AdminInput
														inputSize="sm"
														aria-label="Swatch hex"
														placeholder="#1c1c1e"
														className="w-28"
														{...field}
														value={
															field.value ?? ""
														}
													/>
												</FormControl>
												<input
													type="color"
													aria-label="Pick swatch colour"
													className="size-7 cursor-pointer rounded-[2px] border border-border bg-transparent p-0.5"
													value={
														field.value &&
														isHexColour(field.value)
															? field.value
																	.length ===
																4
																? `#${field.value[1]}${field.value[1]}${field.value[2]}${field.value[2]}${field.value[3]}${field.value[3]}`
																: field.value
															: "#000000"
													}
													onChange={(event) =>
														field.onChange(
															event.target.value,
														)
													}
												/>
												<FormMessage />
											</FormItem>
										)}
									/>
								) : null}
								<button
									type="button"
									aria-label={`Remove option media ${index + 1}`}
									className="ml-auto px-1 text-lg text-muted-foreground leading-none hover:text-destructive"
									onClick={() =>
										form.setValue(
											"optionMedia",
											watchedOptionMedia.filter(
												(_, rowIndex) =>
													rowIndex !== index,
											),
											{ shouldDirty: true },
										)
									}
								>
									×
								</button>
							</div>
							<FormField
								control={form.control}
								name={`optionMedia.${index}.images`}
								render={({ field }) => (
									<FormItem>
										<span className={LABEL}>
											{media.value
												? `${media.value} photos`
												: "Option photos"}
										</span>
										<ProductImagesField
											coverable={false}
											value={field.value}
											onChange={field.onChange}
										/>
										<FormMessage />
									</FormItem>
								)}
							/>
						</li>
					))}
				</ul>
			)}
		</FormSection>
	);

	const publishingSection = (
		<FormSection title="Publishing">
			<div className={cn("grid gap-5", isSheet && "sm:grid-cols-2")}>
				<FormField
					control={form.control}
					name="status"
					render={({ field }) => (
						<FormItem>
							<FormLabel className={LABEL}>Status</FormLabel>
							<FormControl>
								<AdminSelect
									value={field.value}
									onValueChange={field.onChange}
									aria-label="Status"
									options={[
										{ value: "DRAFT", label: "Draft" },
										{ value: "ACTIVE", label: "Active" },
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
					name="categoryId"
					render={({ field }) => (
						<FormItem>
							<FormLabel className={LABEL}>Category</FormLabel>
							<FormControl>
								<AdminSelect
									value={field.value}
									onValueChange={field.onChange}
									placeholder="Choose category"
									aria-label="Category"
									options={categories.map((category) => ({
										value: category.id,
										label: category.name,
									}))}
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
						<FormItem className={cn(isSheet && "sm:col-span-2")}>
							<label className="flex items-center gap-3 rounded-[2px] border border-border p-3 text-[13.5px]">
								<AdminCheckbox
									checked={field.value}
									onChange={field.onChange}
								/>
								<span>
									<strong className="block">
										Featured product
									</strong>
									<span className="text-muted-foreground text-xs">
										Prioritise this item in storefront
										ordering.
									</span>
								</span>
							</label>
							<FormMessage />
						</FormItem>
					)}
				/>
			</div>
		</FormSection>
	);

	const pricingSection = (
		<FormSection title="Price and stock">
			<div className={cn("grid gap-5", isSheet && "sm:grid-cols-2")}>
				<FormField
					control={form.control}
					name="priceInPesewas"
					render={({ field }) => (
						<FormItem>
							<FormLabel className={LABEL}>Price (GH₵)</FormLabel>
							<FormControl>
								<AdminInput
									type="number"
									min="0"
									step="0.01"
									name={field.name}
									value={field.value / 100}
									onChange={(event) =>
										field.onChange(
											Math.round(
												Number(event.target.value) *
													100,
											),
										)
									}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="compareAtInPesewas"
					render={({ field }) => (
						<FormItem>
							<FormLabel className={LABEL}>
								Compare-at price (GH₵)
							</FormLabel>
							<FormControl>
								<AdminInput
									type="number"
									min="0"
									step="0.01"
									name={field.name}
									value={field.value ? field.value / 100 : ""}
									onChange={(event) =>
										field.onChange(
											event.target.value
												? Math.round(
														Number(
															event.target.value,
														) * 100,
													)
												: undefined,
										)
									}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="stockQuantity"
					render={({ field }) => (
						<FormItem>
							<FormLabel className={LABEL}>
								On-hand quantity
							</FormLabel>
							<FormControl>
								<AdminInput
									type="number"
									min="0"
									step="1"
									{...field}
									onChange={(event) =>
										field.onChange(
											Number(event.target.value),
										)
									}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="lowStockThreshold"
					render={({ field }) => (
						<FormItem>
							<FormLabel className={LABEL}>
								Low-stock warning at
							</FormLabel>
							<FormControl>
								<AdminInput
									type="number"
									min="0"
									step="1"
									{...field}
									onChange={(event) =>
										field.onChange(
											Number(event.target.value),
										)
									}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
			</div>
		</FormSection>
	);

	const rootError = form.formState.errors.root?.message;

	if (isSheet) {
		return (
			<Form {...form}>
				<form
					onSubmit={onSubmit}
					className="flex min-h-0 flex-1 flex-col"
					noValidate
				>
					<div className="min-h-0 flex-1 space-y-7 overflow-y-auto px-6 py-7">
						{detailsSection}
						{pricingSection}
						{publishingSection}
						{mediaSection}
						{variantsSection}
						{optionMediaSection}
					</div>

					<div className="shrink-0 border-border border-t px-6 py-4">
						{rootError && (
							<p
								className="mb-3 text-destructive text-sm"
								role="alert"
							>
								{rootError}
							</p>
						)}
						<div className="flex items-center justify-end gap-2">
							{onCancel && (
								<AdminButton type="button" onClick={onCancel}>
									Cancel
								</AdminButton>
							)}
							<AdminButton
								type="submit"
								variant="primary"
								disabled={form.formState.isSubmitting}
							>
								<SaveIcon className="size-4" />
								{form.formState.isSubmitting
									? "Saving…"
									: "Save product"}
							</AdminButton>
						</div>
					</div>
				</form>
			</Form>
		);
	}

	return (
		<Form {...form}>
			<form onSubmit={onSubmit} className="space-y-7" noValidate>
				<div className="flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<Link
							href="/admin/products"
							className="inline-flex items-center gap-1.5 text-muted-foreground text-sm hover:text-foreground"
						>
							<ArrowLeftIcon className="size-4" /> Products
						</Link>
						<h1 className="mt-3 font-semibold text-[clamp(24px,2.4vw,30px)] text-foreground leading-[1.05] tracking-[-0.035em]">
							{productId ? "Edit product" : "Add product"}
						</h1>
					</div>
					<AdminButton
						type="submit"
						variant="primary"
						disabled={form.formState.isSubmitting}
					>
						<SaveIcon className="size-4" />{" "}
						{form.formState.isSubmitting
							? "Saving..."
							: "Save product"}
					</AdminButton>
				</div>

				<div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
					<div className="space-y-7">
						{detailsSection}
						{mediaSection}
						{variantsSection}
						{optionMediaSection}
					</div>

					<aside className="space-y-7 xl:sticky xl:top-6">
						{publishingSection}
						{pricingSection}
					</aside>
				</div>

				{rootError && (
					<p className="text-destructive text-sm" role="alert">
						{rootError}
					</p>
				)}
			</form>
		</Form>
	);
}
