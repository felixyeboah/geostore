import { CartProvider } from "@commerce/components/CartProvider";
import { StoreFooter } from "@commerce/components/StoreFooter";
import { StoreHeader } from "@commerce/components/StoreHeader";
import type { PropsWithChildren } from "react";

export default function StoreLayout({ children }: PropsWithChildren) {
	return (
		<CartProvider>
			<a
				href="#main-content"
				className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-background focus:px-4 focus:py-2 focus:shadow-lg"
			>
				Skip to content
			</a>
			<StoreHeader />
			<main id="main-content">{children}</main>
			<StoreFooter />
		</CartProvider>
	);
}
