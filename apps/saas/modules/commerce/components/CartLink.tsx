"use client";

import { useCart } from "@commerce/components/CartProvider";
import { ShoppingBagIcon } from "lucide-react";
import Link from "next/link";

export function CartLink() {
	const { summary, isHydrated } = useCart();
	const itemCount = isHydrated ? summary.itemCount : 0;

	return (
		<Link
			href="/cart"
			className="relative inline-flex size-11 items-center justify-center rounded-xl bg-foreground text-background transition duration-200 hover:-translate-y-0.5 hover:bg-foreground/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:translate-y-0"
			aria-label={`Shopping bag with ${itemCount} ${itemCount === 1 ? "item" : "items"}`}
		>
			<ShoppingBagIcon className="size-5" />
			{itemCount > 0 && (
				<span className="-right-1.5 -top-1.5 absolute flex min-w-5 items-center justify-center rounded-md bg-primary px-1.5 py-0.5 font-semibold text-[0.6875rem] text-primary-foreground tabular-nums">
					{itemCount > 99 ? "99+" : itemCount}
				</span>
			)}
		</Link>
	);
}
