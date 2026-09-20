"use client";

import { saveStoreCollectionAction } from "@admin/actions/commerce";
import { AdminImageDropzone } from "@admin/components/AdminImageDropzone";
import {
	AdminButton,
	AdminCheckbox,
	AdminInput,
	AdminTextarea,
} from "@admin/components/ui";
import { slugify } from "@admin/lib/category-schema";
import {
	type CollectionFormValues,
	collectionFormSchema,
} from "@admin/lib/collection-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@repo/ui/components/form";
import { toastError, toastSuccess } from "@repo/ui/components/toast";
import { SaveIcon, XIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

const LABEL = "eyebrow text-muted-foreground";

export interface EditableCollection {
	id: string;
	name: string;
	slug: string;
	description: string | null;
	imageUrl: string | null;
	isActive: boolean;
	onLanding: boolean;
	sortOrder: number;
}

export function CollectionForm({
	collection,
	nextSortOrder,
	onSaved,
	onCancel,
}: {
	collection?: EditableCollection;
	/** Where a new collection lands in the running order. */
	nextSortOrder: number;
	onSaved: () => void;
	onCancel: () => void;
}) {
	const router = useRouter();
	// Derived from the name until someone types one, then it is theirs.
	// Editing never re-derives: the slug is already a live address.
	const [slugIsManual, setSlugIsManual] = useState(Boolean(collection));

	const form = useForm<CollectionFormValues>({
		resolver: zodResolver(collectionFormSchema),
		defaultValues: {
			name: collection?.name ?? "",
			slug: collection?.slug ?? "",
			description: collection?.description ?? "",
			imageUrl: collection?.imageUrl ?? "",
			isActive: collection?.isActive ?? true,
			onLanding: collection?.onLanding ?? false,
			sortOrder: collection?.sortOrder ?? nextSortOrder,
		},
	});

	const imageUrl = form.watch("imageUrl");

	const onSubmit = form.handleSubmit(async (values) => {
		const result = await saveStoreCollectionAction(values, collection?.id);

		if (!result.success) {
			toastError("Collection not saved", result.message);
			form.setError("root", { message: result.message });
			return;
		}

		toastSuccess(
			collection ? `${values.name} updated` : `${values.name} created`,
		);
		onSaved();
		router.refresh();
	});

	return (
		<Form {...form}>
			<form
				onSubmit={onSubmit}
				className="flex min-h-0 flex-1 flex-col"
				noValidate
			>
				<div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-7">
					<div className="grid gap-5 sm:grid-cols-2">
						<FormField
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem>
									<FormLabel className={LABEL}>
										Name
									</FormLabel>
									<FormControl>
										<AdminInput
											placeholder="Working from home"
											{...field}
											onChange={(event) => {
												field.onChange(event);
												if (!slugIsManual) {
													form.setValue(
														"slug",
														slugify(
															event.target.value,
														),
														{
															shouldValidate: true,
														},
													);
												}
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
								<FormItem>
									<FormLabel className={LABEL}>
										URL slug
									</FormLabel>
									<FormControl>
										<AdminInput
											placeholder="working-from-home"
											{...field}
											onChange={(event) => {
												setSlugIsManual(true);
												field.onChange(event);
											}}
										/>
									</FormControl>
									<p className="text-muted-foreground text-xs">
										Customers reach it at /shop?collection=
										{field.value || "…"}
									</p>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>

					<FormField
						control={form.control}
						name="description"
						render={({ field }) => (
							<FormItem>
								<FormLabel className={LABEL}>
									Description
								</FormLabel>
								<FormControl>
									<AdminTextarea
										rows={3}
										placeholder="What the collection is for — this is the line under its title."
										{...field}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="imageUrl"
						render={({ field }) => (
							<FormItem>
								{/*
								 * A plain label: a drop area, a preview and a
								 * URL box are not one control, so an htmlFor
								 * would point nowhere.
								 */}
								<span className={LABEL}>Tile image</span>
								{imageUrl ? (
									<div className="relative aspect-[3/2] overflow-hidden rounded-[2px] border border-border bg-muted">
										{/* Unvalidated host until save, so not next/image. */}
										<img
											src={imageUrl}
											alt=""
											className="size-full object-cover"
										/>
										<button
											type="button"
											onClick={() => field.onChange("")}
											aria-label="Remove tile image"
											className="absolute top-2 right-2 inline-flex size-7 items-center justify-center rounded-[2px] bg-white/90 text-destructive hover:bg-white"
										>
											<XIcon className="size-4" />
										</button>
									</div>
								) : (
									<AdminImageDropzone
										onUploaded={([url]) =>
											field.onChange(url)
										}
										title="Drag a tile image here, or click to choose"
										hint="JPG, PNG or WebP, up to 5 MB. Used on the landing band."
									/>
								)}
								<FormControl>
									<AdminInput
										placeholder="…or paste a complete image URL"
										{...field}
										value={field.value ?? ""}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<div className="grid gap-3">
						<FormField
							control={form.control}
							name="isActive"
							render={({ field }) => (
								<FormItem>
									<label className="flex items-center gap-3 rounded-[2px] border border-border p-3 text-[13.5px]">
										<AdminCheckbox
											checked={field.value}
											onChange={field.onChange}
										/>
										<span>
											<strong className="block">
												Visible to customers
											</strong>
											<span className="text-muted-foreground text-xs">
												Hidden collections keep their
												products but disappear from the
												shop and the menu.
											</span>
										</span>
									</label>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="onLanding"
							render={({ field }) => (
								<FormItem>
									<label className="flex items-center gap-3 rounded-[2px] border border-border p-3 text-[13.5px]">
										<AdminCheckbox
											checked={field.value}
											onChange={field.onChange}
										/>
										<span>
											<strong className="block">
												Tile it on the landing page
											</strong>
											<span className="text-muted-foreground text-xs">
												Adds it to the “shop by need”
												band on the home page.
											</span>
										</span>
									</label>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>
				</div>

				<div className="shrink-0 border-border border-t px-6 py-4">
					{form.formState.errors.root?.message && (
						<p
							className="mb-3 text-destructive text-sm"
							role="alert"
						>
							{form.formState.errors.root.message}
						</p>
					)}
					<div className="flex items-center justify-end gap-2">
						<AdminButton type="button" onClick={onCancel}>
							Cancel
						</AdminButton>
						<AdminButton
							type="submit"
							variant="primary"
							disabled={form.formState.isSubmitting}
						>
							<SaveIcon className="size-4" />
							{form.formState.isSubmitting
								? "Saving…"
								: collection
									? "Save collection"
									: "Add collection"}
						</AdminButton>
					</div>
				</div>
			</form>
		</Form>
	);
}
