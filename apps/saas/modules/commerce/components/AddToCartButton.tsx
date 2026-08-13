"use client";

import { useCart } from "@commerce/components/CartProvider";
import type { StoreProduct } from "@commerce/types";
import { Button } from "@repo/ui/components/button";
import { CheckIcon, ShoppingBagIcon } from "lucide-react";
import { useEffect, useState } from "react";

interface AddToCartButtonProps {
	product: StoreProduct;
	size?: "md" | "lg";
	className?: string;
}

export function AddToCartButton({
	product,
	size = "md",
	className,
}: AddToCartButtonProps) {
	const { addItem } = useCart();
	const [isAdded, setIsAdded] = useState(false);

	useEffect(() => {
		if (!isAdded) {
			return;
		}

		const timeoutId = window.setTimeout(() => setIsAdded(false), 1600);
		return () => window.clearTimeout(timeoutId);
	}, [isAdded]);

	function handleAddToCart() {
		addItem(product);
		setIsAdded(true);
	}

	return (
		<Button
			type="button"
			variant="primary"
			size={size}
			className={className}
			disabled={product.stockQuantity < 1}
			onClick={handleAddToCart}
		>
			{isAdded ? (
				<CheckIcon className="size-4" />
			) : (
				<ShoppingBagIcon className="size-4" />
			)}
			{product.stockQuantity < 1
				? "Out of stock"
				: isAdded
					? "Added to bag"
					: "Add to bag"}
		</Button>
	);
}
