"use client";

import {
	type CartLine,
	type CartSummary,
	calculateCart,
	DEFAULT_DELIVERY_RULE,
	type DeliveryRule,
	type StoreProduct,
} from "@repo/commerce";
import {
	createContext,
	type PropsWithChildren,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";

const CART_STORAGE_KEY = "geostoresgh-cart-v1";

export type { CartLine };

interface CartContextValue {
	items: CartLine[];
	summary: CartSummary;
	/** What the shop currently charges for delivery, as saved in Settings. */
	deliveryRule: DeliveryRule;
	isHydrated: boolean;
	addItem: (
		product: StoreProduct,
		quantity?: number,
		variantId?: string,
	) => void;
	updateQuantity: (
		productId: string,
		quantity: number,
		variantId?: string,
	) => void;
	removeItem: (productId: string, variantId?: string) => void;
	clearCart: () => void;
	/** The bag drawer lives here so the nav, cards and toasts can all open it. */
	isDrawerOpen: boolean;
	openDrawer: () => void;
	closeDrawer: () => void;
	setDrawerOpen: (open: boolean) => void;
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

/** Same product *and* same variant is the same cart line. */
function isSameLine(left: CartLine, right: CartLine) {
	return (
		left.productId === right.productId && left.variantId === right.variantId
	);
}

/**
 * `deliveryRule` comes from the server on every render, so a fee changed in
 * the back office reaches the bag on the next page load rather than living on
 * in a build. It has a default only so the provider stays mountable in tests
 * and previews; the layout always passes the saved one.
 */
export function CartProvider({
	children,
	deliveryRule = DEFAULT_DELIVERY_RULE,
}: PropsWithChildren<{ deliveryRule?: DeliveryRule }>) {
	// The prop arrives as a fresh object on every server render, so hold it by
	// its numbers — otherwise the context value changes identity constantly
	// and every consumer re-renders with it.
	const { feeInPesewas, freeOverInPesewas } = deliveryRule;
	const rule = useMemo(
		() => ({ feeInPesewas, freeOverInPesewas }),
		[feeInPesewas, freeOverInPesewas],
	);

	const [items, setItems] = useState<CartLine[]>([]);
	const [isHydrated, setIsHydrated] = useState(false);
	const [isDrawerOpen, setDrawerOpen] = useState(false);
	const hasReadStoredCart = useRef(false);

	useEffect(() => {
		// The merge below treats whatever is already in state as a pending
		// addition, so running it twice folds the stored cart into itself and
		// doubles every quantity. React deliberately double-invokes mount
		// effects in Strict Mode, which made that happen on every dev page
		// load. Reading the stored cart is a one-time step, so guard it.
		if (hasReadStoredCart.current) {
			return;
		}
		hasReadStoredCart.current = true;

		const storedItems = readStoredCart();

		setItems((pendingItems) => {
			// A tap on "Add to bag" that lands before this effect runs — a slow
			// first paint is enough — used to be thrown away wholesale when the
			// stored cart replaced it, so the button said "Added to bag" while
			// the bag stayed empty. Fold those pending additions in instead.
			if (pendingItems.length === 0) {
				return storedItems;
			}

			const mergedItems = [...storedItems];

			for (const pendingItem of pendingItems) {
				const existingIndex = mergedItems.findIndex((item) =>
					isSameLine(item, pendingItem),
				);

				if (existingIndex === -1) {
					mergedItems.push(pendingItem);
					continue;
				}

				const existingItem = mergedItems[existingIndex];
				mergedItems[existingIndex] = {
					...existingItem,
					quantity: Math.min(
						existingItem.quantity + pendingItem.quantity,
						pendingItem.stockQuantity,
					),
				};
			}

			return mergedItems;
		});
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

	const summary = useMemo(() => calculateCart(items, rule), [items, rule]);

	function addItem(product: StoreProduct, quantity = 1, variantId?: string) {
		setItems((currentItems) => {
			const variant = product.variants?.find(
				(item) => item.id === variantId,
			);
			const stockQuantity =
				variant?.stockQuantity ?? product.stockQuantity;
			const priceInPesewas =
				variant?.priceInPesewas ?? product.priceInPesewas;
			const existingItem = currentItems.find(
				(item) =>
					item.productId === product.id &&
					item.variantId === variantId,
			);
			const requestedQuantity = Math.max(1, Math.floor(quantity));

			if (existingItem) {
				return currentItems.map((item) =>
					item.productId === product.id &&
					item.variantId === variantId
						? {
								...item,
								quantity: Math.min(
									item.quantity + requestedQuantity,
									stockQuantity,
								),
								stockQuantity,
								priceInPesewas,
							}
						: item,
				);
			}

			if (stockQuantity < 1) {
				return currentItems;
			}

			return [
				...currentItems,
				{
					productId: product.id,
					variantId,
					variantName: variant?.name,
					name: product.name,
					slug: product.slug,
					imageUrl: product.imageUrl,
					priceInPesewas,
					quantity: Math.min(requestedQuantity, stockQuantity),
					stockQuantity,
				},
			];
		});
	}

	function updateQuantity(
		productId: string,
		quantity: number,
		variantId?: string,
	) {
		setItems((currentItems) =>
			currentItems.map((item) =>
				item.productId === productId && item.variantId === variantId
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

	function removeItem(productId: string, variantId?: string) {
		setItems((currentItems) =>
			currentItems.filter(
				(item) =>
					!(
						item.productId === productId &&
						item.variantId === variantId
					),
			),
		);
	}

	function clearCart() {
		setItems([]);
	}

	const value = useMemo(
		() => ({
			items,
			summary,
			deliveryRule: rule,
			isHydrated,
			addItem,
			updateQuantity,
			removeItem,
			clearCart,
			isDrawerOpen,
			openDrawer: () => setDrawerOpen(true),
			closeDrawer: () => setDrawerOpen(false),
			setDrawerOpen,
		}),
		[items, summary, rule, isHydrated, isDrawerOpen],
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
