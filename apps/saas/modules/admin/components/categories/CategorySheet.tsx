"use client";

import {
	CategoryForm,
	type EditableCategory,
} from "@admin/components/categories/CategoryForm";
import { AdminButton } from "@admin/components/ui";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@repo/ui/components/sheet";
import { PlusIcon } from "lucide-react";
import { parseAsBoolean, parseAsString, useQueryStates } from "nuqs";
import type { ComponentProps } from "react";

/**
 * Add and edit a department, both in a sheet over the list.
 *
 * There are half a dozen departments and the form is five fields, so a route
 * of its own would be all navigation and no benefit — and the list is exactly
 * the context you want while naming one.
 *
 * Open state lives in the URL (`?new=true`, `?edit=<id>`), which keeps a
 * half-finished edit survivable across a refresh and makes either state
 * linkable.
 */
const SHEET_PARAMS = {
	new: parseAsBoolean.withDefault(false),
	edit: parseAsString,
};

const SHEET_OPTIONS = { history: "push" as const, shallow: true };

export function AddCategoryButton({
	label = "Add department",
	variant = "primary",
	size,
}: {
	label?: string;
	variant?: ComponentProps<typeof AdminButton>["variant"];
	size?: ComponentProps<typeof AdminButton>["size"];
}) {
	const [, setParams] = useQueryStates(SHEET_PARAMS, SHEET_OPTIONS);

	return (
		<AdminButton
			variant={variant}
			size={size}
			onClick={() => setParams({ new: true, edit: null })}
		>
			<PlusIcon className="size-4" />
			{label}
		</AdminButton>
	);
}

export function useCategorySheet() {
	const [, setParams] = useQueryStates(SHEET_PARAMS, SHEET_OPTIONS);

	return {
		edit: (id: string) => setParams({ edit: id, new: null }),
	};
}

export function CategorySheet({
	categories,
}: {
	categories: EditableCategory[];
}) {
	const [params, setParams] = useQueryStates(SHEET_PARAMS, SHEET_OPTIONS);

	const editing = params.edit
		? categories.find((category) => category.id === params.edit)
		: undefined;
	// An `?edit=` pointing at a department that has since been deleted must not
	// silently open a blank "add" sheet.
	const isOpen = params.new || Boolean(editing);

	function close() {
		void setParams({ new: null, edit: null });
	}

	const nextSortOrder = categories.length;

	return (
		<Sheet
			open={isOpen}
			onOpenChange={(next) => {
				if (!next) {
					close();
				}
			}}
		>
			{/*
			 * `editorial` has to be repeated here: Radix portals the panel to
			 * <body>, where the admin layout's token overrides no longer reach
			 * it. Same trap as the admin select's listbox.
			 */}
			<SheetContent
				side="right"
				className="editorial flex w-full flex-col gap-0 p-0 sm:max-w-lg"
			>
				<SheetHeader className="shrink-0 space-y-1 border-border border-b px-6 py-5 pr-12 text-left">
					<SheetTitle className="font-semibold text-[20px] text-foreground leading-tight tracking-[-0.02em]">
						{editing ? "Edit department" : "Add department"}
					</SheetTitle>
					<SheetDescription className="text-[13.5px] text-muted-foreground">
						{editing
							? "Changing the slug changes the address customers have bookmarked."
							: "It appears in the shop menu once it is visible and holds a product."}
					</SheetDescription>
				</SheetHeader>

				{isOpen && (
					<CategoryForm
						// A fresh form per department, so switching rows never
						// shows the previous one's values.
						key={editing?.id ?? "new"}
						category={editing}
						nextSortOrder={nextSortOrder}
						onSaved={close}
						onCancel={close}
					/>
				)}
			</SheetContent>
		</Sheet>
	);
}
