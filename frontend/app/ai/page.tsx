"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";

type AssistantProduct = {
  product_id: string;
  product_name: string;
  image_url?: string | null;
  category?: string | null;
  colour?: string | null;
  description?: string | null;
};

type AssistantPayload = {
  answer?: string;
  products?: AssistantProduct[];
};

export default function AIPage() {
  const [prompt, setPrompt] = useState("");
  const [budget, setBudget] = useState("3000");
  const [occasion, setOccasion] = useState("Everyday");
  const [answer, setAnswer] = useState("");
  const [products, setProducts] = useState<AssistantProduct[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function ask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const request = prompt.trim();
    if (!request || loading) return;

    setLoading(true);
    setError("");
    setAnswer("");
    setProducts([]);

    try {
      const query = `Recommend clothing for: ${request}. Occasion: ${occasion}. Budget: ₹${budget}.`;
      const response = await fetch("/api/ai/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, limit: 5, language: "auto" }),
      });
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        const detail = result?.detail;
        throw new Error(typeof detail === "string" ? detail : "The shopping assistant could not process this request.");
      }

      const payload = (result?.data ?? result) as AssistantPayload;
      if (typeof payload.answer !== "string" || !payload.answer.trim()) {
        throw new Error("The assistant returned no answer. Please try again.");
      }

      setAnswer(payload.answer);
      setProducts(Array.isArray(payload.products) ? payload.products : []);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to connect to the shopping assistant.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white px-4 py-10 sm:py-14">
        <div className="mx-auto max-w-4xl">
          <div className="border-b border-blue-100 pb-7 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-700">Your personal stylist</p>
            <h1 className="mt-3 text-3xl font-bold sm:text-4xl">VisionCart AI Assistant</h1>
            <p className="mt-3 text-gray-600">Describe the clothing you need, your occasion and a budget.</p>
          </div>

          <form onSubmit={ask} className="mt-7 border border-blue-100 bg-white p-5 sm:p-8">
            <label htmlFor="style-prompt" className="block text-sm font-semibold">What are you looking for?</label>
            <textarea id="style-prompt" value={prompt} onChange={(event) => setPrompt(event.target.value)} rows={3} maxLength={320} required placeholder="For example: a comfortable outfit for a summer office day" className="mt-2 w-full rounded-md border border-gray-300 p-4 text-sm outline-none focus:border-blue-600" />
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="style-budget" className="text-sm font-semibold">Budget (₹)</label>
                <input id="style-budget" type="number" min="0" max="10000000" step="1" required value={budget} onChange={(event) => setBudget(event.target.value)} className="mt-2 h-11 w-full rounded-md border border-gray-300 px-3 text-sm" />
              </div>
              <div>
                <label htmlFor="style-occasion" className="text-sm font-semibold">Occasion</label>
                <select id="style-occasion" value={occasion} onChange={(event) => setOccasion(event.target.value)} className="mt-2 h-11 w-full rounded-md border border-gray-300 px-3 text-sm">
                  <option>Everyday</option>
                  <option>College</option>
                  <option>Office</option>
                  <option>Party</option>
                  <option>Wedding</option>
                  <option>Vacation</option>
                </select>
              </div>
            </div>
            <button type="submit" disabled={loading || !prompt.trim()} className="mt-5 w-full bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60">
              {loading ? "Finding catalog matches..." : "Get outfit recommendations"}
            </button>
          </form>

          {error && <p role="alert" className="mt-5 border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p>}
          {answer && (
            <section className="mt-7 border border-gray-200 bg-white p-5 sm:p-7" aria-live="polite">
              <h2 className="text-lg font-semibold">Stylist response</h2>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-gray-700">{answer}</p>
              {products.length > 0 && (
                <div className="mt-7 border-t border-gray-200 pt-5">
                  <h3 className="font-semibold">Products from your catalog</h3>
                  <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
                    {products.map((product) => (
                      <Link key={product.product_id} href={`/product/${encodeURIComponent(product.product_id)}`} className="overflow-hidden border border-gray-200 hover:border-blue-500">
                        {product.image_url ? <img src={product.image_url} alt={product.product_name} className="aspect-[3/4] w-full object-cover" /> : <div className="flex aspect-[3/4] items-center justify-center bg-gray-100 text-xs text-gray-500">Image unavailable</div>}
                        <div className="p-3">
                          <p className="line-clamp-2 text-sm font-semibold">{product.product_name}</p>
                          {product.category && <p className="mt-1 text-xs text-gray-600">{product.category}</p>}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          <div className="mt-7 text-center text-sm"><Link href="/shop" className="font-semibold text-blue-700 underline">Browse clothing</Link></div>
        </div>
      </main>
    </>
  );
}
