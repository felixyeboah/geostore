"use client";

import { saveStoreCategoryAction } from "@admin/actions/commerce";
import { AdminImageDropzone } from "@admin/components/AdminImageDropzone";
import {
	AdminButton,
	AdminCheckbox,
	AdminInput,
	AdminTextarea,
} from "@admin/components/ui";
import {
	type CategoryFormValues,
	categoryFormSchema,
	slugify,
} from "@admin/lib/category-schema";
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

export interface EditableCategory {
	id: string;
	name: string;
	slug: string;
	description: string | null;
	imageUrl: string | null;
	isActive: boolean;
	sortOrder: number;
}

export function CategoryForm({
	category,
	nextSortOrder,
	onSaved,
	onCancel,
}: {
	category?: EditableCategory;
	/** Where a new department lands in the running order. */
	nextSortOrder: number;
	onSaved: () => void;
	onCancel: () => void;
}) {
	const router = useRouter();
	// A slug is derived from the name until someone types one, at which point
	// it is theirs. Editing never re-derives: the slug is a live URL.
	const [slugIsManual, setSlugIsManual] = useState(Boolean(category));

	const form = useForm<CategoryFormValues>({
		resolver: zodResolver(categoryFormSchema),
		defaultValues: {
			name: category?.name ?? "",
			slug: category?.slug ?? "",
			description: category?.description ?? "",
			imageUrl: category?.imageUrl ?? "",
			isActive: category?.isActive ?? true,
			sortOrder: category?.sortOrder ?? nextSortOrder,
		},
	});

	const imageUrl = form.watch("imageUrl");

	const onSubmit = form.handleSubmit(async (values) => {
		const result = await saveStoreCategoryAction(values, category?.id);

		if (!result.success) {
			toastError("Department not saved", result.message);
			form.setError("root", { message: result.message });
			return;
		}

		toastSuccess(
			category ? `${values.name} updated` : `${values.name} created`,
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
											placeholder="Phones & tablets"
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
											placeholder="phones-tablets"
											{...field}
											onChange={(event) => {
												setSlugIsManual(true);
												field.onChange(event);
											}}
										/>
									</FormControl>
									<p className="text-muted-foreground text-xs">
										Customers reach it at /categories/
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
										placeholder="One or two lines shown at the top of the department page."
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
								 * A plain label: the field is a drop area, a
								 * preview and a URL box rather than one
								 * control, so an htmlFor would point nowhere.
								 */}
								<span className={LABEL}>Banner image</span>
								{imageUrl ? (
									<div className="relative aspect-[3/1] overflow-hidden rounded-[2px] border border-border bg-muted">
										{/* Unvalidated host until save, so not next/image. */}
										<img
											src={imageUrl}
											alt=""
											className="size-full object-cover"
										/>
										<button
											type="button"
											onClick={() => field.onChange("")}
											aria-label="Remove banner image"
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
										title="Drag a banner here, or click to choose"
										hint="JPG, PNG or WebP, up to 5 MB. Wide images work best."
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
											Hidden departments keep their
											products but disappear from the shop
											and the menu.
										</span>
									</span>
								</label>
								<FormMessage />
							</FormItem>
						)}
					/>
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
								: category
									? "Save department"
									: "Add department"}
						</AdminButton>
					</div>
				</div>
			</form>
		</Form>
	);
}
