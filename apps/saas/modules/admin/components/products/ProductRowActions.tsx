"use client";

import {
	deleteStoreProductAction,
	updateStoreProductStatusAction,
} from "@admin/actions/commerce";
import type { ProductRow } from "@admin/components/products/ProductsTable";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@repo/ui/components/alert-dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import { toastError, toastSuccess } from "@repo/ui/components/toast";
import { storefront } from "@shared/lib/storefront";
import {
	ArchiveIcon,
	ExternalLinkIcon,
	MoreHorizontalIcon,
	PencilIcon,
	Trash2Icon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

/**
 * Per-row actions.
 *
 * Delete is the only one that cannot be undone, so it is separated from the
 * rest, asks first, and names the product in the question — a row menu is easy
 * to open against the wrong row.
 */
export function ProductRowActions({ product }: { product: ProductRow }) {
	const router = useRouter();
	const [confirmingDelete, setConfirmingDelete] = useState(false);
	const [isPending, startTransition] = useTransition();

	function archive() {
		startTransition(async () => {
			const result = await updateStoreProductStatusAction(
				product.id,
				"ARCHIVED",
			);
			if (result.success) {
				toastSuccess(`${product.name} archived`);
				router.refresh();
			} else {
				toastError("Product not archived", result.message);
			}
		});
	}

	function remove() {
		startTransition(async () => {
			const result = await deleteStoreProductAction(product.id);
			setConfirmingDelete(false);

			if (result.success) {
				toastSuccess(result.message);
				router.refresh();
			} else {
				// The common refusal — the product has been ordered — carries
				// its own explanation, so it is shown rather than flattened
				// into a generic failure.
				toastError("Product not deleted", result.message);
			}
		});
	}

	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger
					aria-label={`Actions for ${product.name}`}
					className="inline-flex size-8 items-center justify-center rounded-[2px] border border-transparent text-muted-foreground transition-colors hover:border-border hover:text-foreground focus-visible:border-border focus-visible:outline-none data-[state=open]:border-border data-[state=open]:text-foreground"
				>
					<MoreHorizontalIcon className="size-4" />
				</DropdownMenuTrigger>
				{/*
				 * `editorial` again: Radix portals the panel to <body>, out of
				 * reach of the admin layout's token overrides.
				 */}
				<DropdownMenuContent
					align="end"
					className="editorial w-52 rounded-[2px]"
				>
					{storefront.isConfigured && (
						<DropdownMenuItem asChild>
							<a
								href={storefront.product(product.slug)}
								target="_blank"
								rel="noreferrer"
								className="cursor-pointer gap-2"
							>
								<ExternalLinkIcon className="size-4" />
								View in shop
							</a>
						</DropdownMenuItem>
					)}
					<DropdownMenuItem asChild>
						<Link
							href={`/admin/products/${product.id}`}
							className="cursor-pointer gap-2"
						>
							<PencilIcon className="size-4" />
							Edit product
						</Link>
					</DropdownMenuItem>
					{product.status !== "ARCHIVED" && (
						<DropdownMenuItem
							disabled={isPending}
							onSelect={archive}
							className="cursor-pointer gap-2"
						>
							<ArchiveIcon className="size-4" />
							Archive
						</DropdownMenuItem>
					)}
					<DropdownMenuSeparator />
					<DropdownMenuItem
						disabled={isPending}
						onSelect={(event) => {
							// Radix closes the menu on select, which would
							// unmount the dialog with it if it lived inside.
							event.preventDefault();
							setConfirmingDelete(true);
						}}
						className="cursor-pointer gap-2 text-destructive focus:text-destructive"
					>
						<Trash2Icon className="size-4" />
						Delete product
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>

			<AlertDialog
				open={confirmingDelete}
				onOpenChange={setConfirmingDelete}
			>
				<AlertDialogContent className="editorial rounded-[2px]">
					<AlertDialogHeader>
						<AlertDialogTitle>
							Delete {product.name}?
						</AlertDialogTitle>
						<AlertDialogDescription>
							This removes the product, its images and its
							variants for good. Products that appear on an order
							cannot be deleted — archive those instead.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isPending}>
							Cancel
						</AlertDialogCancel>
						<AlertDialogAction
							disabled={isPending}
							onClick={(event) => {
								event.preventDefault();
								remove();
							}}
							className="bg-destructive text-white hover:bg-destructive/90"
						>
							{isPending ? "Deleting…" : "Delete product"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
