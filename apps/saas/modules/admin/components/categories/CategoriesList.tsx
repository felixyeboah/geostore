"use client";

import {
	deleteStoreCategoryAction,
	reorderStoreCategoriesAction,
	setStoreCategoryActiveAction,
} from "@admin/actions/commerce";
import type { EditableCategory } from "@admin/components/categories/CategoryForm";
import {
	AddCategoryButton,
	useCategorySheet,
} from "@admin/components/categories/CategorySheet";
import { AdminButton } from "@admin/components/ui";
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
	MoreHorizontalIcon,
	PencilIcon,
	Trash2Icon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export interface CategoryRow extends EditableCategory {
	productCount: number;
}

/**
 * The departments, as a list rather than a stack of forms.
 *
 * This screen used to render a full editor for every department at once, so
 * six departments meant six open forms and no way to see the shape of the
 * catalogue. The list is the screen now; editing happens in a sheet.
 *
 * Order matters — it is the order customers see in the shop menu — so it is
 * editable here, where the consequence is visible, rather than as a number
 * buried in a form.
 */
export function CategoriesList({ categories }: { categories: CategoryRow[] }) {
	const router = useRouter();
	const sheet = useCategorySheet();
	const [isPending, startTransition] = useTransition();
	const [deleting, setDeleting] = useState<CategoryRow | null>(null);

	function move(index: number, direction: -1 | 1) {
		const target = index + direction;
		if (target < 0 || target >= categories.length) {
			return;
		}

		const ids = categories.map((category) => category.id);
		[ids[index], ids[target]] = [ids[target], ids[index]];

		startTransition(async () => {
			const result = await reorderStoreCategoriesAction(ids);
			if (result.success) {
				router.refresh();
			} else {
				toastError("Order not saved", result.message);
			}
		});
	}

	function toggleVisibility(category: CategoryRow) {
		startTransition(async () => {
			const result = await setStoreCategoryActiveAction(
				category.id,
				!category.isActive,
			);
			if (result.success) {
				toastSuccess(result.message);
				router.refresh();
			} else {
				toastError("Visibility not changed", result.message);
			}
		});
	}

	function remove(category: CategoryRow) {
		startTransition(async () => {
			const result = await deleteStoreCategoryAction(category.id);
			setDeleting(null);

			if (result.success) {
				toastSuccess(result.message);
				router.refresh();
			} else {
				// The common refusal — it still holds products — carries its
				// own explanation, so it is shown rather than flattened.
				toastError("Department not deleted", result.message);
			}
		});
	}

	if (categories.length === 0) {
		return (
			<div className="mt-9 py-16 text-center">
				<p className="font-medium text-[15px] text-foreground">
					No departments yet
				</p>
				<p className="mx-auto mt-2 max-w-sm text-[13.5px] text-muted-foreground">
					Departments are the top level of the shop — the tabs on
					/shop and the columns in the menu. Every product belongs to
					one, so add the first before adding stock.
				</p>
				<div className="mt-6 flex justify-center">
					<AddCategoryButton label="Add the first department" />
				</div>
			</div>
		);
	}

	return (
		<>
			<ul
				className={cn(
					"mt-9 transition-opacity",
					isPending && "opacity-60",
				)}
			>
				{categories.map((category, index) => (
					<li
						key={category.id}
						className="flex items-center gap-4 border-border border-b py-3.5"
					>
						{/*
						 * Reorder by arrows rather than drag: it needs no
						 * pointer library, works from the keyboard, and the
						 * list is short enough that a drag would be the slower
						 * gesture anyway.
						 */}
						<div className="flex shrink-0 flex-col">
							<button
								type="button"
								onClick={() => move(index, -1)}
								disabled={index === 0 || isPending}
								aria-label={`Move ${category.name} up`}
								className="text-muted-foreground transition-colors hover:text-foreground disabled:opacity-25 disabled:hover:text-muted-foreground"
							>
								<ArrowUpIcon className="size-3.5" />
							</button>
							<button
								type="button"
								onClick={() => move(index, 1)}
								disabled={
									index === categories.length - 1 || isPending
								}
								aria-label={`Move ${category.name} down`}
								className="text-muted-foreground transition-colors hover:text-foreground disabled:opacity-25 disabled:hover:text-muted-foreground"
							>
								<ArrowDownIcon className="size-3.5" />
							</button>
						</div>

						<span className="relative size-12 shrink-0 overflow-hidden rounded-[2px] bg-muted">
							{category.imageUrl && (
								// Unvalidated host, so not next/image.
								<img
									src={category.imageUrl}
									alt=""
									className="size-full object-cover"
								/>
							)}
						</span>

						<div className="min-w-0 flex-1">
							<button
								type="button"
								onClick={() => sheet.edit(category.id)}
								className="block truncate text-left font-medium text-[14px] text-foreground transition-colors hover:text-[var(--ed-accent)]"
							>
								{category.name}
							</button>
							<span className="mt-0.5 block truncate text-[12px] text-muted-foreground">
								<span className="font-mono">
									/{category.slug}
								</span>
								{category.description
									? ` · ${category.description}`
									: ""}
							</span>
						</div>

						<Link
							href={`/admin/products?dept=${category.id}`}
							className="shrink-0 text-[13px] text-muted-foreground tabular-nums transition-colors hover:text-foreground"
						>
							{category.productCount}{" "}
							{category.productCount === 1
								? "product"
								: "products"}
						</Link>

						<button
							type="button"
							onClick={() => toggleVisibility(category)}
							disabled={isPending}
							className={cn(
								"inline-flex w-[86px] shrink-0 items-center justify-center gap-1.5 border py-1 text-[12px] transition-colors",
								category.isActive
									? "border-border text-foreground hover:border-foreground"
									: "border-transparent bg-muted text-muted-foreground hover:text-foreground",
							)}
						>
							{category.isActive ? (
								<EyeIcon className="size-3.5" />
							) : (
								<EyeOffIcon className="size-3.5" />
							)}
							{category.isActive ? "Visible" : "Hidden"}
						</button>

						<DropdownMenu>
							<DropdownMenuTrigger
								aria-label={`Actions for ${category.name}`}
								className="inline-flex size-8 shrink-0 items-center justify-center rounded-[2px] border border-transparent text-muted-foreground transition-colors hover:border-border hover:text-foreground focus-visible:border-border focus-visible:outline-none data-[state=open]:border-border data-[state=open]:text-foreground"
							>
								<MoreHorizontalIcon className="size-4" />
							</DropdownMenuTrigger>
							<DropdownMenuContent
								align="end"
								className="editorial w-52 rounded-[2px]"
							>
								{storefront.isConfigured && (
									<DropdownMenuItem asChild>
										<a
											href={`${storefront.shop}?department=${category.slug}`}
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
									onSelect={() => sheet.edit(category.id)}
									className="cursor-pointer gap-2"
								>
									<PencilIcon className="size-4" />
									Edit department
								</DropdownMenuItem>
								<DropdownMenuItem asChild>
									<Link
										href={`/admin/products?dept=${category.id}`}
										className="cursor-pointer gap-2"
									>
										<EyeIcon className="size-4" />
										See its products
									</Link>
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuItem
									disabled={isPending}
									// Letting the menu close first matters: two Radix modal
									// layers open at once leave aria-hidden on the page after
									// the dialog goes, hiding the whole screen from assistive
									// tech.
									onSelect={() => setDeleting(category)}
									className="cursor-pointer gap-2 text-destructive focus:text-destructive"
								>
									<Trash2Icon className="size-4" />
									Delete department
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</li>
				))}
			</ul>

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
								? `It still holds ${deleting.productCount} ${
										deleting.productCount === 1
											? "product"
											: "products"
									}, so it cannot be deleted — every product must belong to a department. Move them elsewhere first, or hide this one instead.`
								: "This removes the department for good. Hiding it instead keeps the address working."}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isPending}>
							Cancel
						</AlertDialogCancel>
						{deleting?.productCount ? (
							<AdminButton
								variant="primary"
								onClick={() => {
									const target = deleting;
									setDeleting(null);
									if (target) {
										toggleVisibility(target);
									}
								}}
								disabled={isPending || !deleting?.isActive}
							>
								Hide it instead
							</AdminButton>
						) : (
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
								{isPending ? "Deleting…" : "Delete department"}
							</AlertDialogAction>
						)}
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
