"use client";

import type { StoreProduct } from "@repo/commerce";
import { defaultVariantSelection, resolveOptionGallery } from "@repo/commerce";
import {
	createContext,
	type ReactNode,
	useContext,
	useMemo,
	useState,
} from "react";

interface ProductSelectionValue {
	/** The option values currently picked, e.g. `{colour: "Black"}`. */
	selection: Record<string, string>;
	setSelection: (selection: Record<string, string>) => void;
	/**
	 * The gallery resolved for the current selection — the picked value's own
	 * shots first, generic product photography trailing. `undefined` when the
	 * product has no option media.
	 */
	galleryImages?: string[];
}

const ProductSelectionContext = createContext<ProductSelectionValue | null>(
	null,
);

/**
 * Shared option state for the product page: the buy box picks values and the
 * gallery shows what was picked, Amazon-style. Both live in separate columns
 * of the product layout, so the selection travels through context rather
 * than props.
 */
export function ProductSelectionProvider({
	product,
	children,
}: {
	product: StoreProduct;
	children: ReactNode;
}) {
	const [selection, setSelection] = useState<Record<string, string>>(() =>
		defaultVariantSelection(product.variants ?? []),
	);

	const galleryImages = useMemo(
		() =>
			product.optionMedia?.length
				? resolveOptionGallery(product, selection)
				: undefined,
		[product, selection],
	);

	const value = useMemo(
		() => ({ selection, setSelection, galleryImages }),
		[selection, galleryImages],
	);

	return (
		<ProductSelectionContext.Provider value={value}>
			{children}
		</ProductSelectionContext.Provider>
	);
}

export function useProductSelection() {
	return useContext(ProductSelectionContext);
}
