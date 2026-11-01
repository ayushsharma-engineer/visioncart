
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import { fetchProduct, type Product } from "@/lib/products";

export default function ProductDetailsPage() {
  const params = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState("");
  const [size, setSize] = useState("");

  useEffect(() => {
    fetchProduct(params.id)
      .then(setProduct)
      .catch(() => setError("Product nahi mila. Backend API check karo."));
  }, [params.id]);

  function saveToList(key: string, item: Product) {
    const current = JSON.parse(localStorage.getItem(key) || "[]") as Product[];
    if (!current.some((p) => p.product_id === item.product_id)) {
      localStorage.setItem(key, JSON.stringify([...current, item]));
    }
  }

  if (error) return <><Navbar /><main className="p-12 text-center">{error}</main></>;
  if (!product) return <><Navbar /><main className="p-12 text-center">Loading product...</main></>;

  return (
    <>
      <Navbar />
      <main className="mx-auto grid max-w-6xl gap-10 px-5 py-10 md:grid-cols-2">
        <div className="flex min-h-96 items-center justify-center overflow-hidden rounded-2xl bg-gray-100">
          {product.image_url
            ? <img src={product.image_url} alt={product.name} className="h-full max-h-[650px] w-full object-contain" />
            : <span className="text-gray-400">Image unavailable</span>}
        </div>
        <section className="py-4">
          <p className="text-sm text-gray-500">{product.brand || product.category}</p>
          <h1 className="mt-2 text-3xl font-bold">{product.name}</h1>
          <p className="mt-4 text-2xl font-bold">₹{Number(product.price).toLocaleString("en-IN")}</p>
          <p className="mt-5 leading-7 text-gray-600">{product.description || "No description available."}</p>

          {product.available_sizes?.length > 0 && (
            <div className="mt-6">
              <p className="mb-3 font-semibold">Select size</p>
              <div className="flex flex-wrap gap-2">
                {product.available_sizes.map((s) => (
                  <button key={s} onClick={() => setSize(s)}
                    className={`rounded-lg border px-4 py-2 ${size === s ? "border-blue-600 bg-blue-50 text-blue-700" : "border-gray-300"}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={() => {
              if (product.available_sizes?.length && !size) {
                alert("Please select a size.");
                return;
              }
              const cart = JSON.parse(localStorage.getItem("visioncart_cart") || "[]") as (Product & { quantity: number; selectedSize: string })[];
              const existing = cart.find((p) => p.product_id === product.product_id && p.selectedSize === size);
              if (existing) existing.quantity += 1;
              else cart.push({ ...product, quantity: 1, selectedSize: size });
              localStorage.setItem("visioncart_cart", JSON.stringify(cart));
              alert("Added to cart!");
            }}
            className="mt-8 w-full rounded-xl bg-gray-950 px-6 py-4 font-semibold text-white hover:bg-blue-700">
            Add to Cart
          </button>

          <button
            onClick={() => {
              saveToList("visioncart_wishlist", product);
              alert("Saved to wishlist!");
            }}
            className="mt-3 w-full rounded-xl border border-gray-300 px-6 py-4 font-semibold hover:bg-gray-50">
            ♡ Add to Wishlist
          </button>

          {product.colors?.length > 0 && (
            <p className="mt-5 text-sm text-gray-600">Colors: {product.colors.join(", ")}</p>
          )}
        </section>
      </main>
    </>
  );
}
