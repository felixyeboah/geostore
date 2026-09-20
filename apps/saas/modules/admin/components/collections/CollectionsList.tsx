"use client";

import {
	deleteStoreCollectionAction,
	reorderStoreCollectionsAction,
	setStoreCollectionActiveAction,
} from "@admin/actions/commerce";
import type { EditableCollection } from "@admin/components/collections/CollectionForm";
import { CollectionProductsSheet } from "@admin/components/collections/CollectionProductsSheet";
import {
	AddCollectionButton,
	useCollectionSheet,
} from "@admin/components/collections/CollectionSheet";
import { cn } from "@repo/ui";
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
	ArrowDownIcon,
	ArrowUpIcon,
	ExternalLinkIcon,
	EyeIcon,
	EyeOffIcon,
	LayoutTemplateIcon,
	MoreHorizontalIcon,
	PackageIcon,
	PencilIcon,
	Trash2Icon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export interface CollectionRow extends EditableCollection {
	productCount: number;
	productIds: string[];
}

/**
 * The editor-picked collections.
 *
 * A department answers "what kind of thing is it" and every product has
 * exactly one; a collection answers "what is it for" and a product can be in
 * any number of them, or none. That is why this list has no delete guard — the
 * products outlive the grouping — and why membership is edited here rather
 * than one product at a time.
 */
export function CollectionsList({
	collections,
}: {
	collections: CollectionRow[];
}) {
	const router = useRouter();
	const sheet = useCollectionSheet();
	const [isPending, startTransition] = useTransition();
	const [deleting, setDeleting] = useState<CollectionRow | null>(null);
	const [picking, setPicking] = useState<CollectionRow | null>(null);

	function move(index: number, direction: -1 | 1) {
		const target = index + direction;
		if (target < 0 || target >= collections.length) {
			return;
		}

		const ids = collections.map((collection) => collection.id);
		[ids[index], ids[target]] = [ids[target], ids[index]];

		startTransition(async () => {
			const result = await reorderStoreCollectionsAction(ids);
			if (result.success) {
				router.refresh();
			} else {
				toastError("Order not saved", result.message);
			}
		});
	}

	function toggleVisibility(collection: CollectionRow) {
		startTransition(async () => {
			const result = await setStoreCollectionActiveAction(
				collection.id,
				!collection.isActive,
			);
			if (result.success) {
				toastSuccess(result.message);
				router.refresh();
			} else {
				toastError("Visibility not changed", result.message);
			}
		});
	}

	function remove(collection: CollectionRow) {
		startTransition(async () => {
			const result = await deleteStoreCollectionAction(collection.id);
			setDeleting(null);

			if (result.success) {
				toastSuccess(result.message);
				router.refresh();
			} else {
				toastError("Collection not deleted", result.message);
			}
		});
	}

	if (collections.length === 0) {
		return (
			<div className="mt-9 border-border border-t py-16 text-center">
				<p className="font-medium text-[15px] text-foreground">
					No collections yet
				</p>
				<p className="mx-auto mt-2 max-w-md text-[13.5px] text-muted-foreground">
					A collection groups products around a need rather than a
					kind — “Working from home”, “Back to school”. A product can
					be in as many as you like, or none.
				</p>
				<div className="mt-6 flex justify-center">
					<AddCollectionButton label="Add the first collection" />
				</div>
			</div>
		);
	}

	return (
		<>
			<ul
				className={cn(
					"mt-9 border-border border-t transition-opacity",
					isPending && "opacity-60",
				)}
			>
				{collections.map((collection, index) => (
					<li
						key={collection.id}
						className="flex items-center gap-4 border-border border-b py-3.5"
					>
						<div className="flex shrink-0 flex-col">
							<button
								type="button"
								onClick={() => move(index, -1)}
								disabled={index === 0 || isPending}
								aria-label={`Move ${collection.name} up`}
								className="text-muted-foreground transition-colors hover:text-foreground disabled:opacity-25 disabled:hover:text-muted-foreground"
							>
								<ArrowUpIcon className="size-3.5" />
							</button>
							<button
								type="button"
								onClick={() => move(index, 1)}
								disabled={
									index === collections.length - 1 ||
									isPending
								}
								aria-label={`Move ${collection.name} down`}
								className="text-muted-foreground transition-colors hover:text-foreground disabled:opacity-25 disabled:hover:text-muted-foreground"
							>
								<ArrowDownIcon className="size-3.5" />
							</button>
						</div>

						<span className="relative size-12 shrink-0 overflow-hidden rounded-[2px] bg-muted">
							{collection.imageUrl && (
								// Unvalidated host, so not next/image.
								<img
									src={collection.imageUrl}
									alt=""
									className="size-full object-cover"
								/>
							)}
						</span>

						<div className="min-w-0 flex-1">
							<button
								type="button"
								onClick={() => sheet.edit(collection.id)}
								className="block truncate text-left font-medium text-[14px] text-foreground transition-colors hover:text-[var(--ed-accent)]"
							>
								{collection.name}
							</button>
							<span className="mt-0.5 block truncate text-[12px] text-muted-foreground">
								<span className="font-mono">
									?collection={collection.slug}
								</span>
								{collection.onLanding && (
									<span className="ml-2 inline-flex items-center gap-1 font-medium text-[var(--ed-accent)]">
										<LayoutTemplateIcon className="size-3" />
										On the landing page
									</span>
								)}
							</span>
						</div>

						<button
							type="button"
							onClick={() => setPicking(collection)}
							className="shrink-0 text-[13px] text-muted-foreground tabular-nums transition-colors hover:text-foreground"
						>
							{collection.productCount}{" "}
							{collection.productCount === 1
								? "product"
								: "products"}
						</button>

						<button
							type="button"
							onClick={() => toggleVisibility(collection)}
							disabled={isPending}
							className={cn(
								"inline-flex w-[86px] shrink-0 items-center justify-center gap-1.5 border py-1 text-[12px] transition-colors",
								collection.isActive
									? "border-border text-foreground hover:border-foreground"
									: "border-transparent bg-muted text-muted-foreground hover:text-foreground",
							)}
						>
							{collection.isActive ? (
								<EyeIcon className="size-3.5" />
							) : (
								<EyeOffIcon className="size-3.5" />
							)}
							{collection.isActive ? "Visible" : "Hidden"}
						</button>

						<DropdownMenu>
							<DropdownMenuTrigger
								aria-label={`Actions for ${collection.name}`}
								className="inline-flex size-8 shrink-0 items-center justify-center rounded-[2px] border border-transparent text-muted-foreground transition-colors hover:border-border hover:text-foreground focus-visible:border-border focus-visible:outline-none data-[state=open]:border-border data-[state=open]:text-foreground"
							>
								<MoreHorizontalIcon className="size-4" />
							</DropdownMenuTrigger>
							<DropdownMenuContent
								align="end"
								className="editorial w-56 rounded-[2px]"
							>
								{storefront.isConfigured && (
									<DropdownMenuItem asChild>
										<a
											href={`${storefront.shop}?collection=${collection.slug}`}
											target="_blank"
											rel="noreferrer"
											className="cursor-pointer gap-2"
										>
											<ExternalLinkIcon className="size-4" />
											View in shop
										</a>
									</DropdownMenuItem>
								)}
								<DropdownMenuItem
									onSelect={() => sheet.edit(collection.id)}
									className="cursor-pointer gap-2"
								>
									<PencilIcon className="size-4" />
									Edit collection
								</DropdownMenuItem>
								<DropdownMenuItem
									onSelect={() => setPicking(collection)}
									className="cursor-pointer gap-2"
								>
									<PackageIcon className="size-4" />
									Choose its products
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuItem
									disabled={isPending}
									// Letting the menu close first matters: two
									// Radix modal layers open at once leave
									// aria-hidden on the page after the dialog
									// goes, hiding the whole screen from
									// assistive tech.
									onSelect={() => setDeleting(collection)}
									className="cursor-pointer gap-2 text-destructive focus:text-destructive"
								>
									<Trash2Icon className="size-4" />
									Delete collection
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</li>
				))}
			</ul>

			<CollectionProductsSheet
				collection={picking}
				onClose={() => setPicking(null)}
			/>

			<AlertDialog
				open={Boolean(deleting)}
				onOpenChange={(open) => !open && setDeleting(null)}
			>
				<AlertDialogContent className="editorial rounded-[2px]">
					<AlertDialogHeader>
						<AlertDialogTitle>
							Delete {deleting?.name}?
						</AlertDialogTitle>
						<AlertDialogDescription>
							{deleting?.productCount
								? `This removes the grouping only. The ${deleting.productCount} ${
										deleting.productCount === 1
											? "product"
											: "products"
									} in it stay in the catalogue, in their own departments.`
								: "This removes the collection for good. Hiding it instead keeps the address working."}
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
								if (deleting) {
									remove(deleting);
								}
							}}
							className="bg-destructive text-white hover:bg-destructive/90"
						>
							{isPending ? "Deleting…" : "Delete collection"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			<div className="mt-6 flex justify-start">
				<AddCollectionButton variant="quiet" size="sm" />
			</div>
		</>
	);
}
