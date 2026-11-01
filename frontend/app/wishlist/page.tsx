"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { addToCart, readWishlist, writeWishlist } from "@/lib/store";
import type { Product } from "@/lib/products";

export default function WishlistPage() {
  const router = useRouter();
  const [items, setItems] = useState<Product[]>([]);

  useEffect(() => {
    const refresh = () => setItems(readWishlist());
    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener("visioncart-storage", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("visioncart-storage", refresh);
    };
  }, []);

  function remove(productId: string) {
    const nextItems = items.filter((product) => product.product_id !== productId);
    setItems(nextItems);
    writeWishlist(nextItems);
  }

  function addProduct(product: Product) {
    if (product.available_sizes?.length || product.colors?.length) {
      router.push(`/product/${encodeURIComponent(product.product_id)}`);
      return;
    }
    addToCart(product);
    remove(product.product_id);
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-slate-50 px-4 py-7">
        <div className="mx-auto max-w-6xl">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold">My Wishlist</h1>
              <p className="mt-1 text-sm text-gray-600">{items.length} saved products</p>
            </div>
            <Link href="/shop" className="text-sm text-blue-700">Continue shopping →</Link>
          </div>

          {items.length === 0 ? (
            <section className="border border-gray-200 bg-white p-8 sm:p-12">
              <div className="mx-auto max-w-xl text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-3xl" aria-hidden="true">♡</div>
                <p className="mt-4 text-xs font-bold uppercase tracking-widest text-blue-700">Your wishlist</p>
                <h2 className="mt-2 text-2xl font-bold">Keep the styles you love close</h2>
                <p className="mt-2 text-sm text-gray-600">Save products and come back to them anytime.</p>
                <Link href="/shop" className="mt-6 inline-block bg-blue-700 px-6 py-3 text-sm font-semibold text-white">Explore clothing</Link>
              </div>
            </section>
          ) : (
            <section className="border border-gray-200 bg-white">
              {items.map((product) => (
                <article key={product.product_id} className="flex gap-4 border-b p-4 last:border-0 sm:p-5">
                  <Link href={`/product/${encodeURIComponent(product.product_id)}`} className="h-28 w-24 shrink-0 overflow-hidden bg-gray-100 sm:h-32 sm:w-28">
                    {product.image_url ? <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" /> : <span className="flex h-full items-center justify-center px-2 text-xs text-gray-500">Image unavailable</span>}
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link href={`/product/${encodeURIComponent(product.product_id)}`} className="line-clamp-2 text-sm font-semibold">{product.name}</Link>
                    <p className="mt-1 text-xs text-gray-600">{product.brand || product.category}</p>
                    <p className="mt-2 font-bold">₹{Number(product.price).toLocaleString("en-IN")}</p>
                    <div className="mt-3 flex flex-wrap gap-3">
                      <button type="button" onClick={() => addProduct(product)} className="bg-blue-700 px-4 py-2 text-sm font-semibold text-white">{product.available_sizes?.length || product.colors?.length ? "Choose options" : "Add to cart"}</button>
                      <button type="button" onClick={() => remove(product.product_id)} className="px-2 text-sm text-blue-700 underline">Remove</button>
                    </div>
                  </div>
                </article>
              ))}
            </section>
          )}
        </div>
      </main>
    </>
  );
}
