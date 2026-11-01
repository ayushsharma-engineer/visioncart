"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import { useCustomerAuth } from "@/components/CustomerRouteGuard";
import { fetchProduct, type Product } from "@/lib/products";
import { addToCart, readWishlist, toggleWishlist } from "@/lib/store";

export default function ProductPage() {
	const params = useParams<{ id: string }>();
	return <ProductDetails key={params.id} productId={params.id} />;
}

function ProductDetails({ productId }: { productId: string }) {
	const { requestCustomerAccess } = useCustomerAuth();
	const [product, setProduct] = useState<Product | null>(null);
	const [error, setError] = useState("");
	const [size, setSize] = useState("");
	const [color, setColor] = useState("");
	const [quantity, setQuantity] = useState(1);
	const [saved, setSaved] = useState(false);
	const [imageFailed, setImageFailed] = useState(false);
	const [notice, setNotice] = useState("");

	useEffect(() => {
		let active = true;

		fetchProduct(productId)
			.then((result) => {
				if (!active) return;
				setProduct(result);
				setSaved(readWishlist().some((item) => item.product_id === result.product_id));
			})
			.catch(() => {
				if (active) setError("Product not found. Please return to the shop.");
			});

		return () => {
			active = false;
		};
	}, [productId]);

	async function addProduct() {
		if (!product) return;
		if (!(await requestCustomerAccess(`/product/${encodeURIComponent(product.product_id)}`))) return;
		if (product.available_sizes?.length && !size) {
			setNotice("Select a size before adding this item.");
			return;
		}
		if (product.colors?.length && !color) {
			setNotice("Select a color before adding this item.");
			return;
		}

		addToCart(product, size, color, quantity);
		setNotice("Added to your cart.");
	}

	async function toggleSaved() {
		if (!product) return;
		if (!(await requestCustomerAccess(`/product/${encodeURIComponent(product.product_id)}`))) return;
		setSaved(toggleWishlist(product));
	}

	return (
		<>
			<Navbar />
			<main className="min-h-screen bg-slate-50 px-4 py-8">
				<div className="mx-auto max-w-6xl">
					<Link href="/shop" className="text-sm text-blue-700">← Back to shop</Link>
					{error ? (
						<p className="mt-8 border border-red-200 bg-white p-8 text-red-700" role="alert">{error}</p>
					) : !product ? (
						<p className="p-12 text-center text-gray-600" role="status">Loading product...</p>
					) : (
						<div className="mt-5 grid gap-8 border border-gray-200 bg-white p-5 md:grid-cols-2 md:p-8">
							<div className="flex min-h-[360px] items-center justify-center bg-gray-100 md:min-h-[560px]">
								{product.image_url && !imageFailed ? (
									<img src={product.image_url} alt={product.name} onError={() => setImageFailed(true)} className="max-h-[650px] w-full object-contain" />
								) : (
									<span className="px-5 text-center text-sm text-gray-500">Image unavailable</span>
								)}
							</div>

							<section>
								<p className="text-sm text-gray-500">{product.brand || product.category}</p>
								<h1 className="mt-2 text-3xl font-bold">{product.name}</h1>
								<p className="mt-4 text-2xl font-bold">₹{Number(product.price).toLocaleString("en-IN")}</p>
								<p className="mt-5 leading-7 text-gray-600">{product.description || "A versatile addition to your wardrobe."}</p>

								{!!product.available_sizes?.length && (
									<fieldset className="mt-6">
										<legend className="mb-3 text-sm font-semibold">Size</legend>
										<div className="flex flex-wrap gap-2">
											{product.available_sizes.map((itemSize) => (
												<button key={itemSize} type="button" aria-pressed={size === itemSize} onClick={() => { setSize(itemSize); setNotice(""); }} className={`min-w-12 border px-4 py-2 text-sm ${size === itemSize ? "border-blue-700 bg-blue-50 text-blue-800" : "border-gray-300 hover:border-gray-600"}`}>
													{itemSize}
												</button>
											))}
										</div>
									</fieldset>
								)}

								{!!product.colors?.length && (
									<fieldset className="mt-6">
										<legend className="mb-3 text-sm font-semibold">Color</legend>
										<div className="flex flex-wrap gap-2">
											{product.colors.map((itemColor) => (
												<button key={itemColor} type="button" aria-pressed={color === itemColor} onClick={() => { setColor(itemColor); setNotice(""); }} className={`border px-3 py-2 text-sm ${color === itemColor ? "border-blue-700 bg-blue-50 font-semibold text-blue-800" : "border-gray-300 hover:border-gray-600"}`}>
													{itemColor}
												</button>
											))}
										</div>
									</fieldset>
								)}

								<label htmlFor="product-quantity" className="mt-6 block text-sm font-semibold">Quantity</label>
								<input id="product-quantity" type="number" min="1" max="99" value={quantity} onChange={(event) => setQuantity(Math.min(99, Math.max(1, Number(event.target.value) || 1)))} className="mt-2 h-11 w-24 rounded-md border border-gray-300 px-3" />

								{notice && <p className="mt-4 text-sm text-blue-800" role="status">{notice}</p>}
								<button type="button" onClick={addProduct} className="mt-6 w-full bg-blue-700 px-6 py-3.5 font-semibold text-white hover:bg-blue-800">Add to Cart</button>
								<button type="button" aria-pressed={saved} onClick={toggleSaved} className="mt-3 w-full border border-gray-300 px-6 py-3.5 font-semibold hover:bg-gray-50">
									{saved ? "♥ Saved to Wishlist" : "♡ Add to Wishlist"}
								</button>

								<div className="mt-6 border-t pt-5 text-sm text-gray-600">
									<p>Product details from the VisionCart catalog.</p>
									{product.material && <p className="mt-2">Material: {product.material}</p>}
								</div>
							</section>
						</div>
					)}
				</div>
			</main>
		</>
	);
}
