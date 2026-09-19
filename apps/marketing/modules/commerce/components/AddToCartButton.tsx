"use client";

import { useCart } from "@commerce/components/CartProvider";
import { storeToast } from "@commerce/components/storeToast";
import type { StoreProduct } from "@repo/commerce";
import { cn } from "@repo/ui";
import { Button } from "@repo/ui/components/button";
import { CheckIcon, PlusIcon, ShoppingBagIcon } from "lucide-react";
import { useEffect, useState } from "react";

interface AddToCartButtonProps {
	product: StoreProduct;
	variantId?: string;
	size?: "md" | "lg";
	/**
	 * "icon" renders the compact hairline "+"; "text" renders the underlined
	 * text button the editorial catalogue card uses.
	 */
	appearance?: "default" | "icon" | "text";
	className?: string;
}

export function AddToCartButton({
	product,
	variantId,
	size = "md",
	appearance = "default",
	className,
}: AddToCartButtonProps) {
	const { addItem, isHydrated, openDrawer, isDrawerOpen } = useCart();
	const [isAdded, setIsAdded] = useState(false);

	useEffect(() => {
		if (!isAdded) {
			return;
		}

		const timeoutId = window.setTimeout(() => setIsAdded(false), 1600);
		return () => window.clearTimeout(timeoutId);
	}, [isAdded]);

	const variant = product.variants?.find((item) => item.id === variantId);
	const stockQuantity = variant?.stockQuantity ?? product.stockQuantity;
	const isOutOfStock = stockQuantity < 1;

	function handleAddToCart() {
		if (isOutOfStock) {
			storeToast({
				title: "Out of stock",
				description: product.name,
				error: true,
			});
			return;
		}

		addItem(product, 1, variantId);
		setIsAdded(true);

		// With the drawer already open the line appears there immediately, and
		// a toast would only sit on top of the checkout button.
		if (!isDrawerOpen) {
			storeToast({
				imageUrl: product.imageUrl,
				title: "Added to bag",
				description: product.name,
				action: { label: "View bag", onClick: openDrawer },
			});
		}
	}

	if (appearance === "text") {
		return (
			<button
				type="button"
				className={cn(
					"inline-flex items-center gap-1.5 border-transparent border-b pb-px font-medium text-[13px] text-foreground transition-colors hover:border-foreground disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-transparent",
					isAdded &&
						"border-transparent text-[#2f8c52] hover:border-transparent",
					className,
				)}
				disabled={isOutOfStock || !isHydrated}
				onClick={handleAddToCart}
			>
				{isAdded && (
					<CheckIcon className="size-3.5" strokeWidth={2.2} />
				)}
				{isOutOfStock
					? "Out of stock"
					: isAdded
						? "Added"
						: "Add to bag"}
			</button>
		);
	}

	if (appearance === "icon") {
		return (
			<button
				type="button"
				className={cn(
					"inline-flex size-8 items-center justify-center rounded-[4px] border border-border text-foreground transition-colors hover:border-foreground disabled:cursor-not-allowed disabled:opacity-40",
					isAdded &&
						"border-primary bg-primary text-primary-foreground",
					className,
				)}
				disabled={isOutOfStock || !isHydrated}
				onClick={handleAddToCart}
				aria-label={
					isOutOfStock
						? `${product.name} is out of stock`
						: isAdded
							? "Added to bag"
							: `Add ${product.name} to bag`
				}
			>
				{isAdded ? (
					<CheckIcon className="size-4" />
				) : (
					<PlusIcon className="size-4" strokeWidth={1.5} />
				)}
			</button>
		);
	}

	return (
		<Button
			type="button"
			variant="primary"
			size={size}
			className={cn(
				// The squared accent button from the editorial mockup, which
				// the surrounding pages are built to.
				"h-12 gap-2 rounded-[2px] px-[26px] font-semibold text-[14.5px] tracking-[-0.01em]",
				isAdded && "bg-[#2f8c52] hover:bg-[#2f8c52]",
				className,
			)}
			disabled={isOutOfStock || !isHydrated}
			onClick={handleAddToCart}
		>
			{isAdded ? (
				<CheckIcon className="size-4" />
			) : (
				<ShoppingBagIcon className="size-4" />
			)}
			{isOutOfStock
				? "Out of stock"
				: isAdded
					? "Added to bag"
					: "Add to bag"}
		</Button>
	);
}
