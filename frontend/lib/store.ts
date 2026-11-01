import type { Product } from "@/lib/products";

export type CartItem = Product & {
	quantity: number;
	selectedSize: string;
	selectedColor: string;
};

export const CART_KEY = "visioncart_cart";
export const WISHLIST_KEY = "visioncart_wishlist";

function notifyStorageChange() {
	window.dispatchEvent(new Event("visioncart-storage"));
}

export function subscribeToStore(listener: () => void) {
	window.addEventListener("storage", listener);
	window.addEventListener("visioncart-storage", listener);
	return () => {
		window.removeEventListener("storage", listener);
		window.removeEventListener("visioncart-storage", listener);
	};
}

export function getCartSnapshot() {
	return JSON.stringify(readCart());
}

export function getWishlistSnapshot() {
	return JSON.stringify(readWishlist().map((product) => product.product_id));
}

export function readCart(): CartItem[] {
	if (typeof window === "undefined") return [];

	try {
		const items = JSON.parse(localStorage.getItem(CART_KEY) || "[]") as Partial<CartItem>[];
		return items.map((item) => ({
			...item,
			quantity: Math.max(1, Number(item.quantity) || 1),
			selectedSize: item.selectedSize || "",
			selectedColor: item.selectedColor || "",
		})) as CartItem[];
	} catch {
		return [];
	}
}

export function writeCart(items: CartItem[]) {
	localStorage.setItem(CART_KEY, JSON.stringify(items));
	notifyStorageChange();
}

export function readWishlist(): Product[] {
	if (typeof window === "undefined") return [];

	try {
		return JSON.parse(localStorage.getItem(WISHLIST_KEY) || "[]");
	} catch {
		return [];
	}
}

export function writeWishlist(items: Product[]) {
	localStorage.setItem(WISHLIST_KEY, JSON.stringify(items));
	notifyStorageChange();
}

export function addToCart(
	product: Product,
	selectedSize = "",
	selectedColor = "",
	quantity = 1,
) {
	const items = readCart();
	const existing = items.find(
		(item) =>
			item.product_id === product.product_id &&
			item.selectedSize === selectedSize &&
			item.selectedColor === selectedColor,
	);

	if (existing) {
		existing.quantity += quantity;
	} else {
		items.push({
			...product,
			quantity: Math.max(1, quantity),
			selectedSize,
			selectedColor,
		});
	}

	writeCart(items);
}

export function toggleWishlist(product: Product) {
	const items = readWishlist();
	const exists = items.some((item) => item.product_id === product.product_id);
	writeWishlist(
		exists
			? items.filter((item) => item.product_id !== product.product_id)
			: [...items, product],
	);
	return !exists;
}
