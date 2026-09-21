"use client";

import { setStoreCollectionProductsAction } from "@admin/actions/commerce";
import { AdminButton, AdminInput } from "@admin/components/ui";
import { formatMoney } from "@repo/commerce";
import { cn } from "@repo/ui";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@repo/ui/components/sheet";
import { toastError, toastSuccess } from "@repo/ui/components/toast";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useTranslations } from "@shared/lib/translations";
import { useQuery } from "@tanstack/react-query";
import {
	ArrowDownIcon,
	ArrowUpIcon,
	LoaderCircleIcon,
	PlusIcon,
	SearchIcon,
	XIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

interface ProductSummary {
	id: string;
	name: string;
	brand: string;
	sku: string;
	status: string;
	priceInPesewas: number;
	imageUrl: string | null;
}

/**
 * Chooses what is in a collection, and in what order.
 *
 * Order is the point, not a detail: a collection is merchandising, and the
 * stored order is the order the storefront rail shows. So the chosen products
 * are a list you arrange, not a set of ticked boxes.
 *
 * The search runs in the database rather than over a catalogue loaded into the
 * browser, so this keeps working at any size. What is already chosen is
 * fetched by id alongside the search, which is what keeps a chosen product
 * visible when the current query does not match it.
 */
export function CollectionProductsSheet({
	collection,
	onClose,
}: {
	collection: { id: string; name: string; productIds: string[] } | null;
	onClose: () => void;
}) {
	return (
		<Sheet
			open={Boolean(collection)}
			onOpenChange={(next) => {
				if (!next) {
					onClose();
				}
			}}
		>
			<SheetContent
				side="right"
				className="editorial flex w-full flex-col gap-0 p-0 sm:max-w-xl"
			>
				{collection && (
					<PickerBody
						// A fresh picker per collection, so switching rows
						// never inherits the previous one's selection.
						key={collection.id}
						collection={collection}
						onClose={onClose}
					/>
				)}
			</SheetContent>
		</Sheet>
	);
}

function PickerBody({
	collection,
	onClose,
}: {
	collection: { id: string; name: string; productIds: string[] };
	onClose: () => void;
}) {
	const router = useRouter();
	const t = useTranslations();
	const [search, setSearch] = useState("");
	const [page, setPage] = useState(1);
	const [chosenIds, setChosenIds] = useState<string[]>(collection.productIds);
	const [isSaving, startSaving] = useTransition();

	const { data, isFetching } = useQuery(
		orpc.admin.products.search.queryOptions({
			input: { query: search.trim() || undefined, ids: chosenIds, page },
			// Keeps the previous page on screen while the next one loads, so
			// the list does not blink on every keystroke.
			placeholderData: (previous) => previous,
		}),
	);

	const chosenById = new Map<string, ProductSummary>(
		(data?.chosen ?? []).map((product) => [product.id, product]),
	);
	// The stored order is the merchandising order, so the chosen list is built
	// from `chosenIds`, not from whatever order the server returned.
	const chosen = chosenIds.flatMap((id) => {
		const product = chosenById.get(id);
		return product ? [product] : [];
	});
	const results = (data?.products ?? []).filter(
		(product) => !chosenIds.includes(product.id),
	);

	function add(id: string) {
		setChosenIds([...chosenIds, id]);
	}

	function remove(id: string) {
		setChosenIds(chosenIds.filter((item) => item !== id));
	}

	function move(index: number, direction: -1 | 1) {
		const target = index + direction;
		if (target < 0 || target >= chosenIds.length) {
			return;
		}
		const next = [...chosenIds];
		[next[index], next[target]] = [next[target], next[index]];
		setChosenIds(next);
	}

	function save() {
		startSaving(async () => {
			const result = await setStoreCollectionProductsAction(
				collection.id,
				chosenIds,
			);
			if (result.success) {
				toastSuccess(result.message);
				onClose();
				router.refresh();
			} else {
				toastError("Products not saved", result.message);
			}
		});
	}

	const isDirty =
		chosenIds.length !== collection.productIds.length ||
		chosenIds.some((id, index) => collection.productIds[index] !== id);

	return (
		<>
			<SheetHeader className="shrink-0 space-y-1 border-border border-b px-6 py-5 pr-12 text-left">
				<SheetTitle className="font-semibold text-[20px] text-foreground leading-tight tracking-[-0.02em]">
					Products in {collection.name}
				</SheetTitle>
				<SheetDescription className="text-[13.5px] text-muted-foreground">
					The order here is the order customers see in the collection.
				</SheetDescription>
			</SheetHeader>

			<div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
				<section>
					<h3 className="eyebrow text-muted-foreground">
						In this collection ({chosenIds.length})
					</h3>
					{chosen.length === 0 ? (
						<p className="mt-4 text-[13.5px] text-muted-foreground">
							Nothing yet. Add products from the catalogue below.
						</p>
					) : (
						<ul className="mt-4 border-border border-t">
							{chosen.map((product, index) => (
								<li
									key={product.id}
									className="flex items-center gap-3 border-border border-b py-2.5"
								>
									<div className="flex shrink-0 flex-col">
										<button
											type="button"
											onClick={() => move(index, -1)}
											disabled={index === 0}
											aria-label={`Move ${product.name} up`}
											className="text-muted-foreground transition-colors hover:text-foreground disabled:opacity-25"
										>
											<ArrowUpIcon className="size-3.5" />
										</button>
										<button
											type="button"
											onClick={() => move(index, 1)}
											disabled={
												index === chosen.length - 1
											}
											aria-label={`Move ${product.name} down`}
											className="text-muted-foreground transition-colors hover:text-foreground disabled:opacity-25"
										>
											<ArrowDownIcon className="size-3.5" />
										</button>
									</div>
									<ProductLine product={product} />
									<button
										type="button"
										onClick={() => remove(product.id)}
										aria-label={`Remove ${product.name}`}
										className="shrink-0 text-muted-foreground transition-colors hover:text-destructive"
									>
										<XIcon className="size-4" />
									</button>
								</li>
							))}
						</ul>
					)}
				</section>

				<section className="mt-8">
					<h3 className="eyebrow text-muted-foreground">
						Add from the catalogue
					</h3>
					<label className="relative mt-4 block">
						{isFetching ? (
							<LoaderCircleIcon
								aria-hidden="true"
								className="-translate-y-1/2 absolute top-1/2 left-3 size-3.5 animate-spin text-muted-foreground"
							/>
						) : (
							<SearchIcon
								aria-hidden="true"
								className="-translate-y-1/2 absolute top-1/2 left-3 size-3.5 text-muted-foreground"
							/>
						)}
						<span className="sr-only">Search the catalogue</span>
						<AdminInput
							type="search"
							value={search}
							onChange={(event) => {
								setSearch(event.target.value);
								setPage(1);
							}}
							placeholder="Search by name, brand, SKU or department"
							className="h-10 pl-9"
						/>
					</label>

					{results.length === 0 ? (
						<p className="mt-4 text-[13.5px] text-muted-foreground">
							{t("admin.collectionPicker.noUnselected")}
						</p>
					) : (
						<ul className="mt-4 border-border border-t">
							{results.map((product) => (
								<li
									key={product.id}
									className="flex items-center gap-3 border-border border-b py-2.5"
								>
									<ProductLine product={product} />
									<button
										type="button"
										onClick={() => add(product.id)}
										aria-label={`Add ${product.name}`}
										className="inline-flex shrink-0 items-center gap-1 border border-border px-2 py-1 text-[12px] text-foreground transition-colors hover:border-foreground"
									>
										<PlusIcon className="size-3.5" />
										Add
									</button>
								</li>
							))}
						</ul>
					)}
					{data && data.pageCount > 1 && (
						<nav
							aria-label={t("admin.collectionPicker.pages")}
							className="mt-4 flex items-center justify-between gap-3"
						>
							<AdminButton
								type="button"
								disabled={isFetching || data.page <= 1}
								onClick={() => setPage(data.page - 1)}
							>
								{t("admin.collectionPicker.previous")}
							</AdminButton>
							<span className="text-[12px] text-muted-foreground">
								{t("admin.collectionPicker.summary", {
									page: data.page,
									pages: data.pageCount,
									total: data.total,
								})}
							</span>
							<AdminButton
								type="button"
								disabled={
									isFetching || data.page >= data.pageCount
								}
								onClick={() => setPage(data.page + 1)}
							>
								{t("admin.collectionPicker.next")}
							</AdminButton>
						</nav>
					)}
				</section>
			</div>

			<div className="shrink-0 border-border border-t px-6 py-4">
				<div className="flex items-center justify-end gap-2">
					<AdminButton type="button" onClick={onClose}>
						Cancel
					</AdminButton>
					<AdminButton
						variant="primary"
						onClick={save}
						disabled={isSaving || !isDirty}
					>
						{isSaving ? "Saving…" : "Save products"}
					</AdminButton>
				</div>
			</div>
		</>
	);
}

function ProductLine({ product }: { product: ProductSummary }) {
	return (
		<div className="flex min-w-0 flex-1 items-center gap-3">
			<span className="relative size-9 shrink-0 overflow-hidden rounded-[2px] bg-muted">
				{product.imageUrl && (
					// Unvalidated host, so not next/image.
					<img
						src={product.imageUrl}
						alt=""
						className="size-full object-cover"
					/>
				)}
			</span>
			<span className="min-w-0 flex-1">
				<span className="block truncate font-medium text-[13px] text-foreground">
					{product.name}
				</span>
				<span className="mt-0.5 block truncate text-[12px] text-muted-foreground">
					{product.brand} ·{" "}
					<span className="font-mono">{product.sku}</span>
					{product.status !== "ACTIVE" && (
						<span
							className={cn(
								"ml-2 font-medium",
								"text-[var(--ed-accent)]",
							)}
						>
							{product.status === "DRAFT" ? "Draft" : "Archived"}
						</span>
					)}
				</span>
			</span>
			<span className="shrink-0 font-mono text-[12.5px] text-muted-foreground tabular-nums">
				{formatMoney(product.priceInPesewas)}
			</span>
		</div>
	);
}
