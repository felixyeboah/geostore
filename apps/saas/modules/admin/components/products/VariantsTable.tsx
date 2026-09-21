"use client";

import { AdminButton, AdminInput, AdminSwitch } from "@admin/components/ui";
import type { ProductFormValues } from "@repo/api/modules/commerce/types";
import { optionValueHex, variantDisplayName } from "@repo/commerce";
import { cn } from "@repo/ui";
import { FormField } from "@repo/ui/components/form";
import { useState } from "react";
import type { UseFormReturn } from "react-hook-form";

const LABEL = "eyebrow text-muted-foreground";
const COLUMNS =
	"sm:grid-cols-[minmax(0,1fr)_11rem_7.5rem_5.5rem_4.5rem] sm:items-center";

interface VariantsTableProps {
	form: UseFormReturn<ProductFormValues>;
}

/**
 * Every sellable combination, one row each, with the three numbers that
 * differ between them. Rows are generated from the options above and never
 * typed by hand; what the admin does here is price them, stock them and
 * switch off the ones the shop should not offer.
 */
export function VariantsTable({ form }: VariantsTableProps) {
	const variants = form.watch("variants");
	const media = form.watch("optionMedia") ?? [];
	const [bulk, setBulk] = useState<"price" | "stock" | null>(null);
	const [bulkValue, setBulkValue] = useState("");

	if (variants.length === 0) {
		return null;
	}

	const active = variants.filter((variant) => variant.isActive);
	const incomplete = active.filter(
		(variant) =>
			variant.priceInPesewas <= 0 || variant.sku.trim().length < 3,
	);
	const soldOut = active.filter((variant) => variant.stockQuantity <= 0);

	const applyBulk = () => {
		const number = Number(bulkValue);
		if (!bulk || Number.isNaN(number) || number < 0) {
			return;
		}
		form.setValue(
			"variants",
			variants.map((variant) =>
				bulk === "price"
					? { ...variant, priceInPesewas: Math.round(number * 100) }
					: { ...variant, stockQuantity: Math.round(number) },
			),
			{ shouldDirty: true },
		);
		setBulk(null);
		setBulkValue("");
	};

	return (
		<div>
			<div className="mb-3 flex flex-wrap items-center justify-between gap-3">
				<p className="text-[13px] text-muted-foreground">
					<b className="text-foreground">
						{variants.length} combination
						{variants.length === 1 ? "" : "s"}
					</b>{" "}
					· {active.length} on sale
					{variants.length - active.length > 0 &&
						` · ${variants.length - active.length} switched off`}
					. Edit any cell.
				</p>
				{bulk ? (
					<div className="flex items-center gap-2">
						<span className="text-[12.5px] text-muted-foreground">
							{bulk === "price"
								? "Price for all (GH₵)"
								: "Stock for all"}
						</span>
						<AdminInput
							inputSize="sm"
							type="number"
							min="0"
							step={bulk === "price" ? "0.01" : "1"}
							aria-label={
								bulk === "price"
									? "Price for every combination"
									: "Stock for every combination"
							}
							className="w-28"
							value={bulkValue}
							onChange={(event) =>
								setBulkValue(event.target.value)
							}
							// Not a <form>: it would nest inside the product form,
							// and a nested form submits its parent — a page reload
							// mid-edit. Enter applies from the input instead.
							onKeyDown={(event) => {
								if (event.key === "Enter") {
									event.preventDefault();
									applyBulk();
								}
							}}
							autoFocus
						/>
						<AdminButton
							size="sm"
							variant="primary"
							onClick={applyBulk}
						>
							Apply
						</AdminButton>
						<AdminButton
							size="sm"
							variant="ghost"
							onClick={() => setBulk(null)}
						>
							Cancel
						</AdminButton>
					</div>
				) : (
					<div className="flex gap-1.5">
						<AdminButton size="sm" onClick={() => setBulk("price")}>
							Set all prices
						</AdminButton>
						<AdminButton size="sm" onClick={() => setBulk("stock")}>
							Set all stock
						</AdminButton>
					</div>
				)}
			</div>

			<div className={cn("hidden gap-3 pb-2 sm:grid", COLUMNS)}>
				<span className={LABEL}>Combination</span>
				<span className={LABEL}>SKU</span>
				<span className={LABEL}>Price (GH₵)</span>
				<span className={LABEL}>Stock</span>
				<span className={cn(LABEL, "text-center")}>On sale</span>
			</div>
			<ul className="divide-y divide-border border-border border-y">
				{variants.map((variant, index) => {
					const label = variantDisplayName(variant);
					const attributes = Object.entries(variant.attributes ?? {});
					const needsPrice =
						variant.isActive && variant.priceInPesewas <= 0;
					return (
						<li
							key={variant.id ?? `combo-${index}`}
							data-testid={`variant-${index}`}
							className={cn(
								"grid gap-3 py-2.5",
								COLUMNS,
								!variant.isActive && "opacity-50",
							)}
						>
							<div className="flex flex-wrap items-center gap-1.5 font-medium text-[13.5px]">
								{attributes.length > 0 ? (
									attributes.map(([axis, value], i) => {
										const hex = optionValueHex(
											media,
											axis,
											value,
										);
										return (
											<span
												key={axis}
												className="inline-flex items-center gap-1.5"
											>
												{i > 0 && (
													<span className="text-muted-foreground/60">
														·
													</span>
												)}
												{hex && (
													<span
														aria-hidden
														className="size-3 rounded-full border border-black/15"
														style={{
															backgroundColor:
																hex,
														}}
													/>
												)}
												{value}
											</span>
										);
									})
								) : (
									<span className="text-muted-foreground">
										{label}
									</span>
								)}
							</div>
							<FormField
								control={form.control}
								name={`variants.${index}.sku`}
								render={({ field }) => (
									<AdminInput
										inputSize="sm"
										aria-label="Variant SKU"
										{...field}
									/>
								)}
							/>
							<FormField
								control={form.control}
								name={`variants.${index}.priceInPesewas`}
								render={({ field }) => (
									<AdminInput
										inputSize="sm"
										type="number"
										min="0"
										step="0.01"
										aria-label="Variant price"
										aria-invalid={needsPrice || undefined}
										name={field.name}
										value={field.value / 100}
										onChange={(event) =>
											field.onChange(
												Math.round(
													Number(event.target.value) *
														100,
												),
											)
										}
									/>
								)}
							/>
							<FormField
								control={form.control}
								name={`variants.${index}.stockQuantity`}
								render={({ field }) => (
									<AdminInput
										inputSize="sm"
										type="number"
										min="0"
										aria-label="Variant stock"
										{...field}
										onChange={(event) =>
											field.onChange(
												Number(event.target.value),
											)
										}
									/>
								)}
							/>
							<FormField
								control={form.control}
								name={`variants.${index}.isActive`}
								render={({ field }) => (
									<div className="sm:text-center">
										<AdminSwitch
											aria-label={`Offer ${label}`}
											checked={field.value}
											onCheckedChange={field.onChange}
										/>
									</div>
								)}
							/>
						</li>
					);
				})}
			</ul>
			<p
				className={cn(
					"mt-2 text-[12px]",
					incomplete.length
						? "text-destructive"
						: "text-muted-foreground",
				)}
			>
				{incomplete.length
					? `${incomplete
							.map((variant) => variantDisplayName(variant))
							.join(
								", ",
							)} ${incomplete.length === 1 ? "is" : "are"} on sale without a ${
							incomplete.some((v) => v.priceInPesewas <= 0)
								? "price"
								: "SKU"
						}. Fill it in or switch it off.`
					: soldOut.length
						? `${
								soldOut.length > 3
									? `${soldOut.length} combinations`
									: soldOut
											.map((variant) =>
												variantDisplayName(variant),
											)
											.join(", ")
							} ${soldOut.length === 1 ? "shows" : "show"} as out of stock on the shop. Switched-off combinations are never shown at all.`
						: "Switched-off combinations are kept but never shown on the shop — handy for a colour you don't stock yet."}
			</p>
		</div>
	);
}
