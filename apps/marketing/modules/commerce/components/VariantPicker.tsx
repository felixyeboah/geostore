"use client";

import { AddToCartButton } from "@commerce/components/AddToCartButton";
import { storeLinks } from "@commerce/lib/store-links";
import type { StoreProduct } from "@repo/commerce";
import {
	colourHex,
	defaultVariantSelection,
	formatMoney,
	isColourAxis,
	resolveVariant,
	variantAxes,
	variantDisplayName,
} from "@repo/commerce";
import { cn } from "@repo/ui";
import Link from "next/link";
import { useState } from "react";

const OPTION_BUTTON =
	"rounded-[2px] border px-3.5 py-2 text-[13.5px] transition-colors";

/**
 * The buy box, in the language of the featured-product block in
 * design/landing-v5/02-editorial.html: a baseline price row with the saving
 * called out in accent small caps, the stock as an eyebrow rather than a
 * status dot, then a squared accent button beside a plain underlined link.
 *
 * Variants with attributes (Colour, Size, Storage, …) get one picker per
 * axis — colour axes render swatch chips, the rest render pills. Variants
 * without attributes keep the flat name list, so older catalogues are
 * unaffected.
 */
export function VariantPicker({ product }: { product: StoreProduct }) {
	const variants = product.variants ?? [];
	const axes = variantAxes(variants);
	// Axis mode needs every variant to answer every axis — a product mixing
	// attributed and plain variants keeps the flat list so nothing on sale
	// becomes unpickable.
	const useAxes =
		axes.length > 0 &&
		variants.every((variant) =>
			axes.every((axis) => variant.attributes?.[axis.key]?.trim()),
		);

	const [variantId, setVariantId] = useState(variants[0]?.id);
	const [selection, setSelection] = useState<Record<string, string>>(() =>
		defaultVariantSelection(variants),
	);

	/**
	 * Picking one axis re-resolves the rest: if Colour "White" only exists
	 * with Storage "128 GB", choosing White flips Storage to "128 GB" rather
	 * than leaving the buyer on a combination that cannot exist.
	 */
	const pickAxisValue = (axisKey: string, value: string) => {
		const next = { ...selection, [axisKey]: value };
		if (resolveVariant(variants, next)) {
			setSelection(next);
			return;
		}
		const corrected: Record<string, string> = { [axisKey]: value };
		for (const axis of axes) {
			if (axis.key === axisKey) {
				continue;
			}
			corrected[axis.key] =
				axis.values.find((candidate) =>
					resolveVariant(variants, {
						...corrected,
						[axis.key]: candidate,
					}),
				) ?? "";
		}
		setSelection(corrected);
	};

	const selected = useAxes
		? resolveVariant(variants, selection)
		: variants.find((variant) => variant.id === variantId);
	const price = selected?.priceInPesewas ?? product.priceInPesewas;
	const compareAt =
		selected?.compareAtInPesewas ?? product.compareAtInPesewas;
	const stock = selected?.stockQuantity ?? product.stockQuantity;
	const saved = compareAt ? compareAt - price : 0;

	return (
		<div>
			{variants.length > 0 ? (
				useAxes ? (
					<div className="mb-8 space-y-5">
						{axes.map((axis) => (
							<fieldset key={axis.key}>
								<legend className="eyebrow text-muted-foreground">
									{axis.label}
									{selection[axis.key] ? (
										<span className="text-foreground">
											{" "}
											— {selection[axis.key]}
										</span>
									) : null}
								</legend>
								<div className="mt-3.5 flex flex-wrap gap-2">
									{axis.values.map((value) => {
										const isSelected =
											selection[axis.key] === value;
										const hex = isColourAxis(axis.key)
											? colourHex(value)
											: undefined;
										// Struck through when every variant
										// carrying this value is sold out —
										// still pickable, the buy box then
										// reads Out of stock.
										const allSoldOut = variants
											.filter(
												(variant) =>
													variant.attributes?.[
														axis.key
													] === value,
											)
											.every(
												(variant) =>
													variant.stockQuantity < 1,
											);
										return (
											<button
												key={value}
												type="button"
												onClick={() =>
													pickAxisValue(
														axis.key,
														value,
													)
												}
												aria-pressed={isSelected}
												className={cn(
													OPTION_BUTTON,
													"inline-flex items-center gap-2",
													isSelected
														? "border-foreground font-medium text-foreground"
														: "border-border text-muted-foreground hover:border-foreground hover:text-foreground",
													allSoldOut &&
														"line-through",
												)}
											>
												{hex ? (
													<span
														aria-hidden
														className="size-4 rounded-full border border-black/15"
														style={{
															backgroundColor:
																hex,
														}}
													/>
												) : null}
												{value}
											</button>
										);
									})}
								</div>
							</fieldset>
						))}
					</div>
				) : (
					<fieldset className="mb-8">
						<legend className="eyebrow text-muted-foreground">
							Options
						</legend>
						<div className="mt-3.5 flex flex-wrap gap-2">
							{variants.map((variant) => (
								<button
									key={variant.id}
									type="button"
									onClick={() => setVariantId(variant.id)}
									aria-pressed={variant.id === variantId}
									className={cn(
										OPTION_BUTTON,
										variant.id === variantId
											? "border-foreground font-medium text-foreground"
											: "border-border text-muted-foreground hover:border-foreground hover:text-foreground",
										variant.stockQuantity < 1 &&
											"line-through",
									)}
								>
									{variantDisplayName(variant)}
								</button>
							))}
						</div>
					</fieldset>
				)
			) : null}

			<div className="mb-1.5 flex flex-wrap items-baseline gap-3">
				<span className="font-semibold text-[26px] text-foreground tracking-[-0.035em] tabular-nums">
					{formatMoney(price)}
				</span>
				{compareAt ? (
					<s className="text-[15px] text-muted-foreground tabular-nums">
						{formatMoney(compareAt)}
					</s>
				) : null}
				{saved > 0 ? (
					<span className="eyebrow text-[var(--ed-accent)]">
						Save {formatMoney(saved)}
					</span>
				) : null}
			</div>

			<p className="eyebrow text-muted-foreground">
				{stock < 1
					? "Out of stock"
					: stock <= 3
						? `Only ${stock} left`
						: `In stock · ${stock}`}
				{" · ships from Accra"}
			</p>

			<div className="mt-7 flex flex-wrap items-center gap-6">
				{useAxes && !selected ? (
					<button
						type="button"
						disabled
						className="h-12 cursor-not-allowed rounded-[2px] bg-muted px-[26px] font-semibold text-[14.5px] text-muted-foreground"
					>
						Select options
					</button>
				) : (
					<AddToCartButton
						product={product}
						variantId={selected?.id}
					/>
				)}
				<Link
					href={storeLinks.contact}
					className="text-[var(--ed-accent)] text-[13.5px] underline decoration-1 underline-offset-[3px] hover:decoration-2"
				>
					Ask about this &rarr;
				</Link>
			</div>

			<p className="mt-4 text-[12px] text-muted-foreground">
				Payment is taken only after you confirm checkout.
			</p>
		</div>
	);
}
