"use client";

import { type CartSummary, calculateCart } from "@commerce/lib/cart";
import type { StoreProduct } from "@commerce/types";
import {
	createContext,
	type PropsWithChildren,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";

const CART_STORAGE_KEY = "geostoresgh-cart-v1";

export interface CartLine {
	productId: string;
	name: string;
	slug: string;
	imageUrl: string;
	priceInPesewas: number;
	quantity: number;
	stockQuantity: number;
}

interface CartContextValue {
	items: CartLine[];
	summary: CartSummary;
	isHydrated: boolean;
	addItem: (product: StoreProduct, quantity?: number) => void;
	updateQuantity: (productId: string, quantity: number) => void;
	removeItem: (productId: string) => void;
	clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

function isCartLine(value: unknown): value is CartLine {
	if (!value || typeof value !== "object") {
		return false;
	}

	const line = value as Partial<CartLine>;
	return (
		typeof line.productId === "string" &&
		typeof line.name === "string" &&
		typeof line.slug === "string" &&
		typeof line.imageUrl === "string" &&
		typeof line.priceInPesewas === "number" &&
		Number.isInteger(line.priceInPesewas) &&
		typeof line.quantity === "number" &&
		Number.isInteger(line.quantity) &&
		line.quantity > 0 &&
		typeof line.stockQuantity === "number" &&
		Number.isInteger(line.stockQuantity)
	);
}

function readStoredCart(): CartLine[] {
	try {
		const storedCart = window.localStorage.getItem(CART_STORAGE_KEY);
		const parsedCart: unknown = storedCart ? JSON.parse(storedCart) : [];
		return Array.isArray(parsedCart) ? parsedCart.filter(isCartLine) : [];
	} catch {
		return [];
	}
}

export function CartProvider({ children }: PropsWithChildren) {
	const [items, setItems] = useState<CartLine[]>([]);
	const [isHydrated, setIsHydrated] = useState(false);

	useEffect(() => {
		setItems(readStoredCart());
		setIsHydrated(true);
	}, []);

	useEffect(() => {
		if (isHydrated) {
			window.localStorage.setItem(
				CART_STORAGE_KEY,
				JSON.stringify(items),
			);
		}
	}, [isHydrated, items]);

	const summary = useMemo(() => calculateCart(items), [items]);

	function addItem(product: StoreProduct, quantity = 1) {
		setItems((currentItems) => {
			const existingItem = currentItems.find(
				(item) => item.productId === product.id,
			);
			const requestedQuantity = Math.max(1, Math.floor(quantity));

			if (existingItem) {
				return currentItems.map((item) =>
					item.productId === product.id
						? {
								...item,
								quantity: Math.min(
									item.quantity + requestedQuantity,
									product.stockQuantity,
								),
								stockQuantity: product.stockQuantity,
							}
						: item,
				);
			}

			if (product.stockQuantity < 1) {
				return currentItems;
			}

			return [
				...currentItems,
				{
					productId: product.id,
					name: product.name,
					slug: product.slug,
					imageUrl: product.imageUrl,
					priceInPesewas: product.priceInPesewas,
					quantity: Math.min(
						requestedQuantity,
						product.stockQuantity,
					),
					stockQuantity: product.stockQuantity,
				},
			];
		});
	}

	function updateQuantity(productId: string, quantity: number) {
		setItems((currentItems) =>
			currentItems.map((item) =>
				item.productId === productId
					? {
							...item,
							quantity: Math.min(
								Math.max(1, Math.floor(quantity)),
								item.stockQuantity,
							),
						}
					: item,
			),
		);
	}

	function removeItem(productId: string) {
		setItems((currentItems) =>
			currentItems.filter((item) => item.productId !== productId),
		);
	}

	function clearCart() {
		setItems([]);
	}

	const value = useMemo(
		() => ({
			items,
			summary,
			isHydrated,
			addItem,
			updateQuantity,
			removeItem,
			clearCart,
		}),
		[items, summary, isHydrated],
	);

	return (
		<CartContext.Provider value={value}>{children}</CartContext.Provider>
	);
}

export function useCart(): CartContextValue {
	const cart = useContext(CartContext);

	if (!cart) {
		throw new Error("useCart must be used within CartProvider");
	}

	return cart;
}
