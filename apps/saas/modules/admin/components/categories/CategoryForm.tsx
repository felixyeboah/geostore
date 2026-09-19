"use client";

import { saveStoreCategoryAction } from "@admin/actions/commerce";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Textarea } from "@repo/ui/components/textarea";
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
			className="grid gap-4 rounded-2xl border bg-card p-5"
		>
			<div className="grid gap-4 sm:grid-cols-2">
				<div className="grid gap-1.5 text-sm">
					<span className="font-medium">Name</span>
					<Input name="name" defaultValue={category?.name} required />
				</div>
				<div className="grid gap-1.5 text-sm">
					<span className="font-medium">Slug</span>
					<Input name="slug" defaultValue={category?.slug} required />
				</div>
				<div className="grid gap-1.5 text-sm sm:col-span-2">
					<span className="font-medium">Description</span>
					<Textarea
						name="description"
						rows={3}
						defaultValue={category?.description ?? ""}
					/>
				</div>
				<div className="grid gap-1.5 text-sm sm:col-span-2">
					<span className="font-medium">Image URL</span>
					<Input
						name="imageUrl"
						defaultValue={category?.imageUrl ?? ""}
					/>
				</div>
				<div className="grid gap-1.5 text-sm">
					<span className="font-medium">Sort order</span>
					<Input
						name="sortOrder"
						type="number"
						defaultValue={category?.sortOrder ?? 0}
					/>
				</div>
				<label className="flex items-center gap-2 text-sm">
					<input
						type="checkbox"
						name="isActive"
						defaultChecked={category?.isActive ?? true}
					/>
					Active
				</label>
			</div>
			<Button type="submit" disabled={isSaving}>
				{isSaving
					? "Saving..."
					: category
						? "Update category"
						: "Add category"}
			</Button>
		</form>
	);
}
