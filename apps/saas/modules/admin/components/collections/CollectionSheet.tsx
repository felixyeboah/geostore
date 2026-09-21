"use client";

import {
	CollectionForm,
	type EditableCollection,
} from "@admin/components/collections/CollectionForm";
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
 * Add and edit a collection, both in a sheet over the list — the same shape as
 * departments and products, and for the same reason: the list is the context
 * you want while naming and describing one.
 */
const SHEET_PARAMS = {
	new: parseAsBoolean.withDefault(false),
	edit: parseAsString,
};

const SHEET_OPTIONS = { history: "push" as const, shallow: true };

export function AddCollectionButton({
	label = "Add collection",
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

export function useCollectionSheet() {
	const [, setParams] = useQueryStates(SHEET_PARAMS, SHEET_OPTIONS);

	return {
		edit: (id: string) => setParams({ edit: id, new: null }),
	};
}

export function CollectionSheet({
	collections,
	nextSortOrder,
}: {
	collections: EditableCollection[];
	nextSortOrder: number;
}) {
	const [params, setParams] = useQueryStates(SHEET_PARAMS, SHEET_OPTIONS);

	const editing = params.edit
		? collections.find((collection) => collection.id === params.edit)
		: undefined;
	// An `?edit=` pointing at a collection that has since been deleted must not
	// silently open a blank "add" sheet.
	const isOpen = params.new || Boolean(editing);

	function close() {
		void setParams({ new: null, edit: null });
	}

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
						{editing ? "Edit collection" : "Add collection"}
					</SheetTitle>
					<SheetDescription className="text-[13.5px] text-muted-foreground">
						{editing
							? "Changing the slug changes the address customers have bookmarked."
							: "Save it first, then choose which products go in it."}
					</SheetDescription>
				</SheetHeader>

				{isOpen && (
					<CollectionForm
						key={editing?.id ?? "new"}
						collection={editing}
						nextSortOrder={nextSortOrder}
						onSaved={close}
						onCancel={close}
					/>
				)}
			</SheetContent>
		</Sheet>
	);
}
