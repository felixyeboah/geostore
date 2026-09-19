"use client";

import { useCart } from "@commerce/components/CartProvider";
import { ShoppingBagIcon } from "lucide-react";

export function CartLink() {
	const { summary, isHydrated, openDrawer } = useCart();
	const itemCount = isHydrated ? summary.itemCount : 0;

	return (
		<button
			type="button"
			onClick={openDrawer}
			className="relative inline-flex items-center gap-2 font-medium text-[13px] text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
			aria-label={`Shopping bag with ${itemCount} ${itemCount === 1 ? "item" : "items"}`}
		>
			<ShoppingBagIcon className="size-[18px]" strokeWidth={1.75} />
			<span className="hidden sm:inline">Bag</span>
			{itemCount > 0 && (
				<span className="flex min-w-[18px] items-center justify-center rounded-[2px] bg-primary px-1 py-0.5 font-semibold text-[10px] text-primary-foreground tabular-nums">
					{itemCount > 99 ? "99+" : itemCount}
				</span>
			)}
		</button>
	);
}
