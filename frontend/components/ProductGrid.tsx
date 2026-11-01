"use client";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react"; import Link from "next/link"; import { useRouter } from "next/navigation"; import { fetchProducts, type Product } from "@/lib/products"; import { addToCart, getWishlistSnapshot, subscribeToStore, toggleWishlist } from "@/lib/store";
import { useCustomerAuth } from "@/components/CustomerRouteGuard";

type SortOrder = "featured" | "price-low" | "price-high" | "name";
export default function ProductGrid({search = "", category, pageSize = 40}:{search?: string; category?: string; pageSize?: number}) {
	const router = useRouter();
	const { requestCustomerAccess } = useCustomerAuth();
	const [items, setItems] = useState<Product[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const wishlistSnapshot = useSyncExternalStore(subscribeToStore, getWishlistSnapshot, getWishlistSnapshot);
	const savedIds = new Set(JSON.parse(wishlistSnapshot) as string[]);
	const [selectedCategory, setSelectedCategory] = useState(category || "");
	const [minimumPrice, setMinimumPrice] = useState("");
	const [maximumPrice, setMaximumPrice] = useState("");
	const [availableOnly, setAvailableOnly] = useState(false);
	const [sortOrder, setSortOrder] = useState<SortOrder>("featured");
	const [notice, setNotice] = useState("");
	const [reloadKey, setReloadKey] = useState(0);

	useEffect(() => {
		let active = true;

		fetchProducts({
			search,
			category: selectedCategory || undefined,
			page: 1,
			page_size: pageSize,
		})
			.then((result) => {
				if (active) {
					setItems(result.items);
					setError("");
				}
			})
			.catch(() => {
				if (active) setError("Products could not load. Check that the backend is running.");
			})
			.finally(() => {
				if (active) setLoading(false);
			});

		return () => {
			active = false;
		};
	}, [search, selectedCategory, pageSize, reloadKey]);

	const categories = useMemo(
		() => Array.from(new Set(items.map((product) => product.category).filter(Boolean))).sort(),
		[items],
	);

	const visibleItems = useMemo(() => {
		const minimum = minimumPrice === "" ? 0 : Number(minimumPrice);
		const maximum = maximumPrice === "" ? Number.POSITIVE_INFINITY : Number(maximumPrice);
		const filtered = items.filter((product) => {
			const hasSizes = product.available_sizes?.length > 0;
			return (
				Number(product.price) >= minimum &&
				Number(product.price) <= maximum &&
				(!availableOnly || hasSizes)
			);
		});

		switch (sortOrder) {
			case "price-low":
				return filtered.sort((left, right) => left.price - right.price);
			case "price-high":
				return filtered.sort((left, right) => right.price - left.price);
			case "name":
				return filtered.sort((left, right) => left.name.localeCompare(right.name));
			default:
				return filtered;
		}
	}, [availableOnly, items, maximumPrice, minimumPrice, sortOrder]);

	function clearFilters() {
		const defaultCategory = category || "";
		if (selectedCategory !== defaultCategory) {
			setLoading(true);
			setError("");
			setSelectedCategory(defaultCategory);
		}
		setMinimumPrice("");
		setMaximumPrice("");
		setAvailableOnly(false);
		setSortOrder("featured");
	}

	async function addProduct(product: Product) {
		const destination = `/product/${encodeURIComponent(product.product_id)}`;
		if (!(await requestCustomerAccess(destination))) return;

		if (product.available_sizes?.length || product.colors?.length) {
			router.push(destination);
			return;
		}

		addToCart(product);
		setNotice(`${product.name} added to cart`);
		window.setTimeout(() => setNotice(""), 2400);
	}

	async function toggleSaved(product: Product) {
		if (!(await requestCustomerAccess(`/product/${encodeURIComponent(product.product_id)}`))) return;
		toggleWishlist(product);
	}

	return (
		<div className="grid gap-7 lg:grid-cols-[220px_minmax(0,1fr)]">
			<aside className="h-fit border-b border-gray-200 pb-5 lg:sticky lg:top-24 lg:border-b-0 lg:border-r lg:pr-5">
				<div className="flex items-center justify-between">
					<h2 className="text-sm font-semibold">Filters</h2>
					<button type="button" onClick={clearFilters} className="text-xs text-blue-700 underline">
						Clear
					</button>
				</div>

				<label className="mt-5 block text-xs font-semibold text-gray-700" htmlFor="product-category">
					Category
				</label>
				<select
					id="product-category"
					value={selectedCategory}
					onChange={(event) => {
						setLoading(true);
						setError("");
						setSelectedCategory(event.target.value);
					}}
					className="mt-2 h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm"
				>
					<option value="">All categories</option>
					{categories.map((item) => <option key={item} value={item}>{item}</option>)}
				</select>

				<fieldset className="mt-5">
					<legend className="text-xs font-semibold text-gray-700">Price range (₹)</legend>
					<div className="mt-2 grid grid-cols-2 gap-2">
						<input aria-label="Minimum price" type="number" min="0" value={minimumPrice} onChange={(event) => setMinimumPrice(event.target.value)} placeholder="Min" className="h-10 min-w-0 rounded-md border border-gray-300 px-2 text-sm" />
						<input aria-label="Maximum price" type="number" min="0" value={maximumPrice} onChange={(event) => setMaximumPrice(event.target.value)} placeholder="Max" className="h-10 min-w-0 rounded-md border border-gray-300 px-2 text-sm" />
					</div>
					{minimumPrice && maximumPrice && Number(minimumPrice) > Number(maximumPrice) && (
						<p className="mt-2 text-xs text-red-700" role="alert">Minimum price must not exceed maximum price.</p>
					)}
				</fieldset>

				<label className="mt-5 flex items-center gap-2 text-sm text-gray-700">
					<input type="checkbox" checked={availableOnly} onChange={(event) => setAvailableOnly(event.target.checked)} className="h-4 w-4 accent-blue-700" />
					Available sizes only
				</label>
			</aside>

			<section aria-label="Products">
				<div className="mb-4 flex flex-wrap items-center justify-between gap-3">
					<p className="text-sm text-gray-600" aria-live="polite">
						{loading ? "Loading products..." : `${visibleItems.length} products`}
					</p>
					<label className="flex items-center gap-2 text-sm">
						<span className="text-gray-600">Sort by</span>
						<select value={sortOrder} onChange={(event) => setSortOrder(event.target.value as SortOrder)} className="h-10 rounded-md border border-gray-300 bg-white px-3">
							<option value="featured">Featured</option>
							<option value="price-low">Price: low to high</option>
							<option value="price-high">Price: high to low</option>
							<option value="name">Name</option>
						</select>
					</label>
				</div>

				{notice && <p role="status" className="mb-4 border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">{notice}</p>}
				{loading ? (
					<p className="py-16 text-center text-gray-500" role="status">Loading clothing collection...</p>
				) : error ? (
					<div className="border border-red-200 bg-white p-8 text-center" role="alert">
						<p className="text-sm text-red-700">{error}</p>
						<button type="button" onClick={() => { setLoading(true); setError(""); setReloadKey((value) => value + 1); }} className="mt-3 text-sm font-semibold text-blue-700 underline">Retry</button>
					</div>
				) : visibleItems.length === 0 ? (
					<div className="border border-gray-200 bg-white p-10 text-center">
						<h2 className="font-semibold">No products match these filters</h2>
						<p className="mt-2 text-sm text-gray-600">Clear a filter or try a different search.</p>
						<button type="button" onClick={clearFilters} className="mt-4 text-sm font-semibold text-blue-700 underline">Clear filters</button>
					</div>
				) : (
					<div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
						{visibleItems.map((product) => (
							<article key={product.product_id} className="group min-w-0 border border-gray-100 bg-white transition hover:shadow-md">
								<div className="relative aspect-[3/4] overflow-hidden bg-gray-100">
									<Link href={`/product/${encodeURIComponent(product.product_id)}`} className="block h-full">
										{product.image_url ? (
											<img src={product.image_url} alt={product.name} loading="lazy" className="h-full w-full object-cover transition group-hover:scale-105" />
										) : (
											<span className="flex h-full items-center justify-center text-xs text-gray-500">Image unavailable</span>
										)}
									</Link>
									<button type="button" aria-label={`${savedIds.has(product.product_id) ? "Remove from" : "Add to"} wishlist: ${product.name}`} aria-pressed={savedIds.has(product.product_id)} onClick={() => void toggleSaved(product)} className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white text-lg shadow">
										{savedIds.has(product.product_id) ? "♥" : "♡"}
									</button>
								</div>
								<div className="p-3 sm:p-4">
									<p className="truncate text-xs text-gray-500">{product.brand || product.category}</p>
									<Link href={`/product/${encodeURIComponent(product.product_id)}`} className="mt-1 line-clamp-2 min-h-10 text-sm font-semibold hover:text-blue-700">{product.name}</Link>
									<div className="mt-3 flex items-center justify-between gap-2">
										<b>₹{Number(product.price).toLocaleString("en-IN")}</b>
										<button type="button" onClick={() => addProduct(product)} className="rounded-md bg-blue-700 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-800">
											{product.available_sizes?.length || product.colors?.length ? "Choose options" : "Add"}
										</button>
									</div>
								</div>
							</article>
						))}
					</div>
				)}
			</section>
		</div>
	);
}
