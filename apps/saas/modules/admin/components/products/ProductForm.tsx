"use client";

import { saveStoreProductAction } from "@admin/actions/commerce";
import { zodResolver } from "@hookform/resolvers/zod";
import {
	type ProductFormValues,
	productFormSchema,
} from "@repo/api/modules/commerce/types";
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
import { toastError, toastSuccess } from "@repo/ui/components/toast";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation } from "@tanstack/react-query";
import {
	ArrowLeftIcon,
	ImagePlusIcon,
	LoaderCircleIcon,
	SaveIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

interface ProductFormProps {
	productId?: string;
	categories: Array<{ id: string; name: string }>;
	defaultValues: ProductFormValues;
}

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

export function ProductForm({
	productId,
	categories,
	defaultValues,
}: ProductFormProps) {
	const router = useRouter();
	const imageUploadMutation = useMutation(
		orpc.admin.products.imageUploadUrl.mutationOptions(),
	);
	const form = useForm<ProductFormValues>({
		resolver: zodResolver(productFormSchema),
		defaultValues,
	});
	const specificationsText = specificationsToText(
		form.watch("specifications"),
	);

	async function uploadImages(files: FileList | null) {
		if (!files?.length) {
			return;
		}

		try {
			const uploadedUrls: string[] = [];
			for (const file of Array.from(files)) {
				if (
					!["image/jpeg", "image/png", "image/webp"].includes(
						file.type,
					)
				) {
					throw new Error("Use JPG, PNG, or WebP images.");
				}
				if (file.size > 5 * 1024 * 1024) {
					throw new Error("Each image must be 5 MB or smaller.");
				}
				const upload = await imageUploadMutation.mutateAsync({
					contentType: file.type as
						| "image/jpeg"
						| "image/png"
						| "image/webp",
				});
				const response = await fetch(upload.signedUploadUrl, {
					method: "PUT",
					body: file,
					headers: { "Content-Type": file.type },
				});
				if (!response.ok) {
					throw new Error("The image upload failed.");
				}
				uploadedUrls.push(upload.fileUrl);
			}
			form.setValue(
				"imageUrls",
				[...form.getValues("imageUrls"), ...uploadedUrls],
				{
					shouldDirty: true,
					shouldValidate: true,
				},
			);
			toastSuccess(
				`${uploadedUrls.length} image${uploadedUrls.length === 1 ? "" : "s"} uploaded`,
			);
		} catch (error) {
			toastError(
				"Image upload failed",
				error instanceof Error ? error.message : undefined,
			);
		}
	}

	const onSubmit = form.handleSubmit(async (values) => {
		const result = await saveStoreProductAction(values, productId);

		if (!result.success) {
			toastError("Product not saved", result.message);
			form.setError("root", { message: result.message });
			return;
		}

		toastSuccess(productId ? "Product updated" : "Product created");
		router.push("/admin/products");
		router.refresh();
	});

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
						<h1 className="mt-2 font-semibold text-2xl">
							{productId ? "Edit product" : "Add product"}
						</h1>
					</div>
					<Button
						type="submit"
						disabled={form.formState.isSubmitting}
					>
						<SaveIcon className="size-4" />{" "}
						{form.formState.isSubmitting
							? "Saving..."
							: "Save product"}
					</Button>
				</div>

				<div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
					<div className="space-y-6">
						<section className="rounded-2xl border bg-card p-5">
							<h2 className="font-semibold text-lg">
								Product information
							</h2>
							<div className="mt-5 grid gap-5 sm:grid-cols-2">
								<FormField
									control={form.control}
									name="name"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Name</FormLabel>
											<FormControl>
												<Input
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
											<FormLabel>URL slug</FormLabel>
											<FormControl>
												<Input
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
											<FormLabel>Brand</FormLabel>
											<FormControl>
												<Input
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
									name="sku"
									render={({ field }) => (
										<FormItem>
											<FormLabel>SKU</FormLabel>
											<FormControl>
												<Input
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
									name="shortDescription"
									render={({ field }) => (
										<FormItem className="sm:col-span-2">
											<FormLabel>
												Short description
											</FormLabel>
											<FormControl>
												<Textarea
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
											<FormLabel>
												Full description
											</FormLabel>
											<FormControl>
												<Textarea
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
						</section>

						<section className="rounded-2xl border bg-card p-5">
							<h2 className="font-semibold text-lg">
								Images and specifications
							</h2>
							<div className="mt-5 grid gap-5">
								<FormField
									control={form.control}
									name="imageUrls"
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												Product image URLs
											</FormLabel>
											<label className="mb-3 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed bg-muted/35 px-4 py-6 font-medium text-sm transition hover:bg-muted">
												<input
													type="file"
													accept="image/jpeg,image/png,image/webp"
													multiple
													className="sr-only"
													disabled={
														imageUploadMutation.isPending
													}
													onChange={(event) =>
														uploadImages(
															event.target.files,
														)
													}
												/>
												{imageUploadMutation.isPending ? (
													<LoaderCircleIcon className="size-4 animate-spin" />
												) : (
													<ImagePlusIcon className="size-4" />
												)}
												{imageUploadMutation.isPending
													? "Uploading…"
													: "Upload product images"}
											</label>
											<FormControl>
												<Textarea
													rows={4}
													value={field.value.join(
														"\n",
													)}
													onChange={(event) =>
														field.onChange(
															event.target.value
																.split("\n")
																.map((value) =>
																	value.trim(),
																)
																.filter(
																	Boolean,
																),
														)
													}
													placeholder="https://...\nhttps://..."
												/>
											</FormControl>
											<p className="text-muted-foreground text-xs">
												Upload JPG, PNG, or WebP files
												up to 5 MB, or add one complete
												image URL per line.
											</p>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="specifications"
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												Specifications
											</FormLabel>
											<FormControl>
												<Textarea
													rows={6}
													value={specificationsText}
													onChange={(event) =>
														field.onChange(
															textToSpecifications(
																event.target
																	.value,
															),
														)
													}
													placeholder="Storage: 256 GB\nWarranty: 12 months"
												/>
											</FormControl>
											<p className="text-muted-foreground text-xs">
												Use one “Label: Value”
												specification per line.
											</p>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
						</section>

						<section className="rounded-2xl border bg-card p-5">
							<div className="flex items-center justify-between gap-3">
								<h2 className="font-semibold text-lg">
									Variants
								</h2>
								<Button
									type="button"
									variant="secondary"
									size="sm"
									onClick={() =>
										form.setValue("variants", [
											...form.getValues("variants"),
											{
												name: "",
												sku: "",
												priceInPesewas:
													form.getValues(
														"priceInPesewas",
													) || 100,
												stockQuantity: 0,
												attributes: {},
												isActive: true,
											},
										])
									}
								>
									Add option
								</Button>
							</div>
							<p className="mt-2 text-muted-foreground text-sm">
								Use variants for storage, colour, or size. Leave
								empty to sell the product as a single SKU.
							</p>
							<div className="mt-5 space-y-4">
								{form
									.watch("variants")
									.map((variant, index) => (
										<div
											key={variant.id ?? `new-${index}`}
											className="grid gap-3 rounded-xl bg-muted/45 p-4 sm:grid-cols-2"
										>
											<FormField
												control={form.control}
												name={`variants.${index}.name`}
												render={({ field }) => (
													<FormItem>
														<FormLabel>
															Name
														</FormLabel>
														<FormControl>
															<Input
																placeholder="256 GB"
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
														<FormLabel>
															SKU
														</FormLabel>
														<FormControl>
															<Input {...field} />
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
														<FormLabel>
															Price (GH₵)
														</FormLabel>
														<FormControl>
															<Input
																type="number"
																min="0"
																step="0.01"
																value={
																	field.value /
																	100
																}
																onChange={(
																	event,
																) =>
																	field.onChange(
																		Math.round(
																			Number(
																				event
																					.target
																					.value,
																			) *
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
														<FormLabel>
															Stock
														</FormLabel>
														<FormControl>
															<Input
																type="number"
																min="0"
																{...field}
																onChange={(
																	event,
																) =>
																	field.onChange(
																		Number(
																			event
																				.target
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
											<button
												type="button"
												className="text-left text-destructive text-sm sm:col-span-2"
												onClick={() =>
													form.setValue(
														"variants",
														form
															.getValues(
																"variants",
															)
															.filter(
																(
																	_,
																	itemIndex,
																) =>
																	itemIndex !==
																	index,
															),
													)
												}
											>
												Remove option
											</button>
										</div>
									))}
							</div>
						</section>
					</div>

					<aside className="space-y-6 xl:sticky xl:top-6">
						<section className="rounded-2xl border bg-card p-5">
							<h2 className="font-semibold">Publishing</h2>
							<div className="mt-5 grid gap-5">
								<FormField
									control={form.control}
									name="status"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Status</FormLabel>
											<FormControl>
												<select
													{...field}
													className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
												>
													<option value="DRAFT">
														Draft
													</option>
													<option value="ACTIVE">
														Active
													</option>
													<option value="ARCHIVED">
														Archived
													</option>
												</select>
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
											<FormLabel>Category</FormLabel>
											<FormControl>
												<select
													{...field}
													className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
												>
													<option value="">
														Choose category
													</option>
													{categories.map(
														(category) => (
															<option
																key={
																	category.id
																}
																value={
																	category.id
																}
															>
																{category.name}
															</option>
														),
													)}
												</select>
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
											<label className="flex items-center gap-3 rounded-xl bg-muted/55 p-3 text-sm">
												<input
													type="checkbox"
													checked={field.value}
													onChange={field.onChange}
													className="size-4 accent-primary"
												/>
												<span>
													<strong className="block">
														Featured product
													</strong>
													<span className="text-muted-foreground text-xs">
														Prioritise this item in
														storefront ordering.
													</span>
												</span>
											</label>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
						</section>

						<section className="rounded-2xl border bg-card p-5">
							<h2 className="font-semibold">Price and stock</h2>
							<div className="mt-5 grid gap-5">
								<FormField
									control={form.control}
									name="priceInPesewas"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Price (GH₵)</FormLabel>
											<FormControl>
												<Input
													type="number"
													min="0"
													step="0.01"
													value={field.value / 100}
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
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="compareAtInPesewas"
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												Compare-at price (GH₵)
											</FormLabel>
											<FormControl>
												<Input
													type="number"
													min="0"
													step="0.01"
													value={
														field.value
															? field.value / 100
															: ""
													}
													onChange={(event) =>
														field.onChange(
															event.target.value
																? Math.round(
																		Number(
																			event
																				.target
																				.value,
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
											<FormLabel>
												On-hand quantity
											</FormLabel>
											<FormControl>
												<Input
													type="number"
													min="0"
													step="1"
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
								<FormField
									control={form.control}
									name="lowStockThreshold"
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												Low-stock warning at
											</FormLabel>
											<FormControl>
												<Input
													type="number"
													min="0"
													step="1"
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
						</section>
					</aside>
				</div>

				{form.formState.errors.root?.message && (
					<p className="text-destructive text-sm" role="alert">
						{form.formState.errors.root.message}
					</p>
				)}
			</form>
		</Form>
	);
}
