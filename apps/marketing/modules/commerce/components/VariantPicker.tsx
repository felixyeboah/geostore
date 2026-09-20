"use client";

import { AddToCartButton } from "@commerce/components/AddToCartButton";
import { storeLinks } from "@commerce/lib/store-links";
import type { StoreProduct } from "@repo/commerce";
import { formatMoney } from "@repo/commerce";
import Link from "next/link";
import { useMemo, useState } from "react";

/**
 * The buy box, in the language of the featured-product block in
 * design/landing-v5/02-editorial.html: a baseline price row with the saving
 * called out in accent small caps, the stock as an eyebrow rather than a
 * status dot, then a squared accent button beside a plain underlined link.
 */
export function VariantPicker({ product }: { product: StoreProduct }) {
	const variants = product.variants ?? [];
	const [variantId, setVariantId] = useState(variants[0]?.id);
	const selected = useMemo(
		() => variants.find((variant) => variant.id === variantId),
		[variantId, variants],
	);
	const price = selected?.priceInPesewas ?? product.priceInPesewas;
	const compareAt =
		selected?.compareAtInPesewas ?? product.compareAtInPesewas;
	const stock = selected?.stockQuantity ?? product.stockQuantity;
	const saved = compareAt ? compareAt - price : 0;

	return (
		<div>
			{variants.length > 0 ? (
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
								className={`rounded-[2px] border px-3.5 py-2 text-[13.5px] transition-colors ${
									variant.id === variantId
										? "border-foreground font-medium text-foreground"
										: "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
								}`}
							>
								{variant.name}
							</button>
						))}
					</div>
				</fieldset>
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
				<AddToCartButton product={product} variantId={variantId} />
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
