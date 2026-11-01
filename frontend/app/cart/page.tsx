"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { readCart, readWishlist, writeCart, writeWishlist, type CartItem } from "@/lib/store";

export default function CartPage() {
	const [items, setItems] = useState<CartItem[]>([]);

	useEffect(() => {
		const refresh = () => setItems(readCart());
		refresh();
		window.addEventListener("storage", refresh);
		window.addEventListener("visioncart-storage", refresh);
		return () => {
			window.removeEventListener("storage", refresh);
			window.removeEventListener("visioncart-storage", refresh);
		};
	}, []);

	function update(nextItems: CartItem[]) {
		setItems(nextItems);
		writeCart(nextItems);
	}

	function saveForLater(item: CartItem) {
		const wishlist = readWishlist();
		if (!wishlist.some((product) => product.product_id === item.product_id)) {
			writeWishlist([...wishlist, item]);
		}
		update(items.filter((cartItem) => cartItem !== item));
	}

	const subtotal = items.reduce((total, item) => total + Number(item.price) * item.quantity, 0);
	const itemCount = items.reduce((total, item) => total + item.quantity, 0);

	return (
		<>
			<Navbar />
			<main className="min-h-screen bg-slate-50 px-4 py-7">
				<div className="mx-auto max-w-6xl">
					<div className="mb-5 flex flex-wrap items-end justify-between gap-3">
						<div>
							<h1 className="text-2xl font-bold">Your Shopping Cart</h1>
							<p className="mt-1 text-sm text-gray-500">Review your pieces before checkout</p>
						</div>
						<Link href="/shop" className="text-sm text-blue-700">Continue shopping →</Link>
					</div>

					{items.length === 0 ? (
						<section className="border border-gray-200 bg-white p-8 sm:p-12">
							<div className="mx-auto max-w-xl text-center">
								<div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-3xl" aria-hidden="true">🛒</div>
								<p className="mt-4 text-xs font-bold uppercase tracking-widest text-blue-700">Your cart is empty</p>
								<h2 className="mt-2 text-2xl font-bold">Your cart is waiting for a little style</h2>
								<p className="mt-2 text-sm text-gray-600">Explore the latest looks and add your favourites here.</p>
								<div className="mt-6 flex flex-wrap justify-center gap-3">
									<Link href="/shop" className="bg-blue-700 px-6 py-3 text-sm font-semibold text-white">Explore clothing</Link>
									<Link href="/wishlist" className="border border-gray-300 px-6 py-3 text-sm font-semibold">View wishlist</Link>
								</div>
							</div>
						</section>
					) : (
						<div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
							<section className="border border-gray-200 bg-white">
								<div className="border-b px-5 py-3 text-sm text-gray-600">{itemCount} items in your cart</div>
								{items.map((item) => (
									<article key={`${item.product_id}-${item.selectedSize}-${item.selectedColor}`} className="flex gap-4 border-b p-4 last:border-0 sm:p-5">
										<Link href={`/product/${encodeURIComponent(item.product_id)}`} className="h-28 w-24 shrink-0 overflow-hidden bg-gray-100 sm:h-32 sm:w-28">
											{item.image_url ? <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" /> : <span className="flex h-full items-center justify-center px-2 text-xs text-gray-500">Image unavailable</span>}
										</Link>
										<div className="min-w-0 flex-1">
											<Link href={`/product/${encodeURIComponent(item.product_id)}`} className="line-clamp-2 text-sm font-semibold">{item.name}</Link>
											<p className="mt-1 text-xs text-gray-600">{item.brand || item.category}{item.selectedSize ? ` · Size ${item.selectedSize}` : ""}{item.selectedColor ? ` · ${item.selectedColor}` : ""}</p>
											<p className="mt-2 font-bold">₹{Number(item.price).toLocaleString("en-IN")}</p>
											<div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
												<div className="flex h-9 items-center border border-gray-300">
													<button type="button" aria-label={`Decrease ${item.name} quantity`} onClick={() => update(item.quantity === 1 ? items.filter((cartItem) => cartItem !== item) : items.map((cartItem) => cartItem === item ? { ...cartItem, quantity: cartItem.quantity - 1 } : cartItem))} className="h-full w-9">−</button>
													<span className="min-w-8 text-center" aria-live="polite">{item.quantity}</span>
													<button type="button" aria-label={`Increase ${item.name} quantity`} onClick={() => update(items.map((cartItem) => cartItem === item ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem))} className="h-full w-9">+</button>
												</div>
												<button type="button" onClick={() => update(items.filter((cartItem) => cartItem !== item))} className="text-blue-700 underline">Remove</button>
												<button type="button" onClick={() => saveForLater(item)} className="text-blue-700 underline">Save for later</button>
											</div>
										</div>
										<p className="hidden shrink-0 text-sm font-semibold sm:block">₹{(Number(item.price) * item.quantity).toLocaleString("en-IN")}</p>
									</article>
								))}
								<div className="px-5 py-4 text-right text-sm">Subtotal: <strong>₹{subtotal.toLocaleString("en-IN")}</strong></div>
							</section>

							<aside className="border border-gray-200 bg-white p-5">
								<h2 className="text-base font-semibold">Order summary</h2>
								<div className="mt-4 flex justify-between text-sm"><span>Subtotal</span><span>₹{subtotal.toLocaleString("en-IN")}</span></div>
								<div className="mt-2 flex justify-between text-sm text-gray-600"><span>Shipping</span><span>Not calculated</span></div>
								<div className="mt-4 flex justify-between border-t pt-4 font-bold"><span>Estimated total</span><span>₹{subtotal.toLocaleString("en-IN")}</span></div>
								<Link href="/checkout" className="mt-5 block bg-blue-700 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-blue-800">Continue to checkout</Link>
								<p className="mt-3 text-xs leading-5 text-gray-600">Order placement and payment are not available yet.</p>
							</aside>
						</div>
					)}

					<section className="mt-8 border-t border-gray-200 pt-5">
						<div className="flex items-center justify-between">
							<h2 className="text-lg font-bold">Keep exploring</h2>
							<Link href="/shop" className="text-sm text-blue-700">Shop clothing →</Link>
						</div>
					</section>
				</div>
			</main>
		</>
	);
}
