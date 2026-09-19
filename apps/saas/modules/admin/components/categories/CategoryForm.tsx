"use client";

import { saveStoreCategoryAction } from "@admin/actions/commerce";
import {
	AdminButton,
	AdminCheckbox,
	AdminInput,
	AdminTextarea,
} from "@admin/components/ui";
import { toastError, toastSuccess } from "@repo/ui/components/toast";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface CategoryFormProps {
	category?: {
		id: string;
		name: string;
		slug: string;
		description: string | null;
		imageUrl: string | null;
		isActive: boolean;
		sortOrder: number;
	};
}

export function CategoryForm({ category }: CategoryFormProps) {
	const router = useRouter();
	const [isSaving, setIsSaving] = useState(false);

	async function handleSubmit(formData: FormData) {
		setIsSaving(true);
		const result = await saveStoreCategoryAction(
			{
				name: String(formData.get("name") ?? ""),
				slug: String(formData.get("slug") ?? ""),
				description: String(formData.get("description") ?? ""),
				imageUrl: String(formData.get("imageUrl") ?? ""),
				isActive: formData.get("isActive") === "on",
				sortOrder: Number(formData.get("sortOrder") ?? 0),
			},
			category?.id,
		);
		setIsSaving(false);
		if (!result.success) {
			toastError("Category not saved", result.message);
			return;
		}
		toastSuccess(result.message);
		router.refresh();
	}

	return (
		<form
			action={handleSubmit}
			className="grid gap-6 border-border border-t pt-7"
		>
			<div className="grid gap-6 sm:grid-cols-2">
				<div className="grid gap-2.5">
					<span className="eyebrow block text-muted-foreground">
						Name
					</span>
					<AdminInput
						name="name"
						defaultValue={category?.name}
						required
					/>
				</div>
				<div className="grid gap-2.5">
					<span className="eyebrow block text-muted-foreground">
						Slug
					</span>
					<AdminInput
						name="slug"
						defaultValue={category?.slug}
						required
					/>
				</div>
				<div className="grid gap-2.5 sm:col-span-2">
					<span className="eyebrow block text-muted-foreground">
						Description
					</span>
					<AdminTextarea
						name="description"
						rows={3}
						defaultValue={category?.description ?? ""}
					/>
				</div>
				<div className="grid gap-2.5 sm:col-span-2">
					<span className="eyebrow block text-muted-foreground">
						Image URL
					</span>
					<AdminInput
						name="imageUrl"
						defaultValue={category?.imageUrl ?? ""}
					/>
				</div>
				<div className="grid gap-2.5">
					<span className="eyebrow block text-muted-foreground">
						Sort order
					</span>
					<AdminInput
						name="sortOrder"
						type="number"
						defaultValue={category?.sortOrder ?? 0}
					/>
				</div>
				<label className="flex items-center gap-2.5 self-end pb-3 text-[13.5px] text-foreground">
					<AdminCheckbox
						name="isActive"
						defaultChecked={category?.isActive ?? true}
					/>
					Active
				</label>
			</div>
			<div>
				<AdminButton
					type="submit"
					variant="primary"
					disabled={isSaving}
				>
					{isSaving
						? "Saving…"
						: category
							? "Update category"
							: "Add category"}
				</AdminButton>
			</div>
		</form>
	);
}
