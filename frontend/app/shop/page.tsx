"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import ProductGrid from "@/components/ProductGrid";

function ShopContent() {
	const searchParams = useSearchParams();
	const search = searchParams.get("search") || "";
	const category = searchParams.get("category") || undefined;

	return (
		<>
			<Navbar />
			<main className="min-h-screen bg-slate-50">
				<div className="mx-auto max-w-[1400px] px-4 py-8 lg:px-8">
					<p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">VisionCart Collection</p>
					<h1 className="mt-2 text-3xl font-bold">
						{search ? `Results for "${search}"` : category || "Shop Clothing"}
					</h1>
					<p className="mb-7 mt-2 text-sm text-gray-500">Explore styles for every day and every occasion.</p>
					  <ProductGrid key={`${search}-${category || "all"}`} search={search} category={category} pageSize={40} />
				</div>
			</main>
		</>
	);
}

export default function ShopPage() {
	return (
		<Suspense fallback={<p className="p-10" role="status">Loading shop...</p>}>
			<ShopContent />
		</Suspense>
	);
}
