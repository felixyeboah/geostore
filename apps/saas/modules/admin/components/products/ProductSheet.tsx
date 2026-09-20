"use client";

import {
	EMPTY_PRODUCT,
	ProductForm,
} from "@admin/components/products/ProductForm";
import { AdminButton } from "@admin/components/ui";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@repo/ui/components/sheet";
import { PlusIcon } from "lucide-react";
import { parseAsBoolean, useQueryState } from "nuqs";
import type { ComponentProps } from "react";

/**
 * Adding a product used to be a route of its own. It is a side sheet now: the
 * list stays behind it, so an admin can check an existing SKU, brand or price
 * while typing the new one, and lands back on the table with the row already
 * there instead of being navigated twice.
 *
 * The open state lives in the URL rather than in component state, which keeps
 * `/admin/products?new=true` linkable — that is where the retired
 * `/admin/products/new` route now redirects.
 */
const NEW_PRODUCT_PARAM = parseAsBoolean
	.withDefault(false)
	.withOptions({ history: "push", shallow: true });

export function AddProductButton({
	label = "Add product",
	variant = "primary",
	size,
}: {
	label?: string;
	variant?: ComponentProps<typeof AdminButton>["variant"];
	size?: ComponentProps<typeof AdminButton>["size"];
}) {
	const [, setOpen] = useQueryState("new", NEW_PRODUCT_PARAM);

	return (
		<AdminButton
			variant={variant}
			size={size}
			onClick={() => setOpen(true)}
		>
			<PlusIcon className="size-4" />
			{label}
		</AdminButton>
	);
}

export function AddProductSheet({
	categories,
}: {
	categories: Array<{ id: string; name: string }>;
}) {
	const [open, setOpen] = useQueryState("new", NEW_PRODUCT_PARAM);

	function close() {
		setOpen(null);
	}

	return (
		<Sheet
			open={open}
			onOpenChange={(next) => (next ? setOpen(true) : close())}
		>
			{/*
			 * `editorial` has to be repeated here: Radix portals the panel to
			 * <body>, where the admin layout's token overrides no longer reach
			 * it. Same trap as the admin select's listbox.
			 */}
			<SheetContent
				side="right"
				className="editorial flex w-full flex-col gap-0 p-0 sm:max-w-xl lg:max-w-2xl"
			>
				<SheetHeader className="shrink-0 space-y-1 border-border border-b px-6 py-5 pr-12 text-left">
					<SheetTitle className="font-semibold text-[20px] text-foreground leading-tight tracking-[-0.02em]">
						Add product
					</SheetTitle>
					<SheetDescription className="text-[13.5px] text-muted-foreground">
						Save it as a draft to keep it off the storefront until
						the photos and copy are ready.
					</SheetDescription>
				</SheetHeader>

				<ProductForm
					variant="sheet"
					categories={categories}
					defaultValues={EMPTY_PRODUCT}
					onSaved={close}
					onCancel={close}
				/>
			</SheetContent>
		</Sheet>
	);
}
