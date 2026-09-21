"use client";

import type { ProductFormValues } from "@repo/api/modules/commerce/types";
import {
	formatMoney,
	isColourAxis,
	optionMediaKey,
	optionValueHex,
	variantAxes,
} from "@repo/commerce";
import { cn } from "@repo/ui";
import { useState } from "react";
import type { SoldAs } from "./product-readiness";

interface ProductPreviewProps {
	values: ProductFormValues;
	soldAs: SoldAs;
	categoryName?: string;
}

/**
 * The shopper's view, redrawn from the form as it is typed.
 *
 * It is not the storefront component — that renders from stored rows with
 * their own resolution rules — but it answers the questions an admin has
 * while filling the form: which photo is the cover, what a colour's gallery
 * looks like, what each combination costs and whether it can be bought.
 */
export function ProductPreview({
	values,
	soldAs,
	categoryName,
}: ProductPreviewProps) {
	const [picks, setPicks] = useState<Record<string, string>>({});
	const axes = soldAs === "options" ? variantAxes(values.variants) : [];

	// The current pick per axis: whatever was clicked, else the first value.
	const pick: Record<string, string> = {};
	for (const axis of axes) {
		const chosen = picks[axis.key];
		pick[axis.key] =
			chosen && axis.values.includes(chosen) ? chosen : axis.values[0];
	}
	const variant = values.variants.find((row) =>
		axes.every((axis) => {
			const entry = Object.entries(row.attributes ?? {}).find(
				([key]) => key.trim().toLowerCase() === axis.key.toLowerCase(),
			);
			return entry?.[1].trim() === pick[axis.key];
		}),
	);

	const colourAxis = axes.find((axis) => isColourAxis(axis.key));
	const colourMedia = colourAxis
		? values.optionMedia.find(
				(row) =>
					optionMediaKey(row.axis, row.value) ===
					optionMediaKey(colourAxis.key, pick[colourAxis.key]),
			)
		: undefined;
	const gallery = colourMedia?.images.length
		? colourMedia.images
		: values.imageUrls;
	const hero = gallery[0];

	const price =
		soldAs === "options"
			? (variant?.priceInPesewas ?? values.priceInPesewas)
			: values.priceInPesewas;
	const stock =
		soldAs === "options"
			? (variant?.stockQuantity ?? 0)
			: values.stockQuantity;
	const onSale = soldAs === "options" ? (variant?.isActive ?? false) : true;
	const sku = soldAs === "options" ? (variant?.sku ?? "") : values.sku;
	const compareAt = values.compareAtInPesewas;

	return (
		<div>
			<div className="rounded-[2px] border border-border bg-white p-5">
				<div
					className={cn(
						"flex h-[200px] items-center justify-center overflow-hidden rounded-[2px] bg-[#fbf8f7]",
						!hero &&
							"border border-border border-dashed text-[13px] text-muted-foreground",
					)}
				>
					{hero ? (
						<img
							src={hero}
							alt=""
							className="size-full object-contain"
						/>
					) : (
						"No photo yet"
					)}
				</div>
				{gallery.length > 1 && (
					<ul className="mt-2 flex gap-1.5">
						{gallery.slice(0, 5).map((url) => (
							<li
								key={url}
								className="size-10 overflow-hidden rounded-[2px] border border-border"
							>
								<img
									src={url}
									alt=""
									className="size-full object-cover"
								/>
							</li>
						))}
					</ul>
				)}

				<p className="eyebrow mt-4 text-muted-foreground">
					{values.brand || "Brand"} · {categoryName ?? "Department"}
				</p>
				<p
					className={cn(
						"mt-1 font-semibold text-[19px] leading-[1.15] tracking-[-0.025em]",
						!values.name && "text-muted-foreground/60",
					)}
				>
					{values.name || "Product name"}
				</p>
				<p className="mt-2 flex items-baseline gap-2">
					<b className="font-semibold text-[18px] tabular-nums">
						{formatMoney(price)}
					</b>
					{compareAt && compareAt > price ? (
						<s className="text-[13px] text-muted-foreground/70 tabular-nums">
							{formatMoney(compareAt)}
						</s>
					) : null}
				</p>

				{axes.map((axis) => {
					const isColour = isColourAxis(axis.key);
					return (
						<div key={axis.key} className="mt-3.5">
							<p className="eyebrow mb-2 text-muted-foreground">
								{axis.label}
								{isColour ? ` — ${pick[axis.key]}` : ""}
							</p>
							<div className="flex flex-wrap gap-2">
								{axis.values.map((value) => {
									const isPicked = pick[axis.key] === value;
									const combination = values.variants.find(
										(row) =>
											axes.every((other) => {
												const wanted =
													other.key === axis.key
														? value
														: pick[other.key];
												const entry = Object.entries(
													row.attributes ?? {},
												).find(
													([key]) =>
														key
															.trim()
															.toLowerCase() ===
														other.key.toLowerCase(),
												);
												return (
													entry?.[1].trim() === wanted
												);
											}),
									);
									const unavailable =
										!combination || !combination.isActive;
									const hex = isColour
										? optionValueHex(
												values.optionMedia,
												axis.key,
												value,
											)
										: undefined;
									return (
										<button
											key={value}
											type="button"
											aria-label={value}
											aria-pressed={isPicked}
											title={
												isColour && !hex
													? `${value} (no swatch yet)`
													: value
											}
											onClick={() =>
												setPicks((current) => ({
													...current,
													[axis.key]: value,
												}))
											}
											className={cn(
												isColour
													? "size-[26px] rounded-full border border-black/15"
													: "rounded-[2px] border border-border bg-white px-3 py-1.5 text-[12.5px]",
												isPicked &&
													(isColour
														? "outline outline-2 outline-foreground outline-offset-2"
														: "border-foreground ring-1 ring-foreground"),
												!isColour &&
													unavailable &&
													"text-muted-foreground/60 line-through",
											)}
											style={
												isColour
													? {
															background:
																hex ??
																"repeating-linear-gradient(45deg,#fff 0 4px,#e2e1dc 4px 8px)",
														}
													: undefined
											}
										>
											{isColour ? null : value}
										</button>
									);
								})}
							</div>
						</div>
					);
				})}

				<div
					className={cn(
						"mt-4 grid h-10 place-items-center rounded-[2px] font-semibold text-[13px]",
						onSale && stock > 0
							? "bg-foreground text-background"
							: "bg-muted text-muted-foreground",
					)}
				>
					{!onSale
						? "Not available"
						: stock > 0
							? "Add to bag"
							: "Out of stock"}
				</div>
				<p className="mt-2 text-[12px] text-muted-foreground tabular-nums">
					{stock} in stock
					{sku ? ` · SKU ${sku}` : ""}
					{soldAs === "options" && axes.length > 0 && !variant
						? " · no combination matches"
						: ""}
				</p>
			</div>
			<p className="mt-2.5 text-center text-[12px] text-muted-foreground/80">
				Updates as you type.
				{axes.length > 0 &&
					" Click a swatch or size to see that combination and its own photos."}
			</p>
		</div>
	);
}
