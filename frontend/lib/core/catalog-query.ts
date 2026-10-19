import type { Facets, Paginated, Product, ProductQuery } from "../../types/domain.ts";
import { discountPercent } from "./money.ts";
import { productStock, sortSizes } from "./variants.ts";

/**
 * In-memory implementation of product search/filter/sort/paginate.
 * Used by the dev fixtures. A real backend will do this server-side; the
 * ProductQuery shape is the contract the future endpoint should accept.
 */

export const DEFAULT_PAGE_SIZE = 12;

function tokens(q: string): string[] {
  return q
    .toLowerCase()
    .split(/[^a-z0-9₹]+/i)
    .filter(Boolean);
}

function searchScore(p: Product, toks: string[]): number {
  if (toks.length === 0) return 0;
  const name = p.name.toLowerCase();
  const brand = (p.brand ?? "").toLowerCase();
  const cat = (p.category?.name ?? "").toLowerCase();
  const desc = (p.description ?? "").toLowerCase();
  const attrs = JSON.stringify(p.attributes ?? {}).toLowerCase();
  let total = 0;
  for (const t of toks) {
    let s = 0;
    if (name.includes(t)) s += 3;
    if (brand.includes(t)) s += 2;
    if (cat.includes(t)) s += 2;
    if (desc.includes(t)) s += 1;
    if (attrs.includes(t)) s += 1;
    if (s === 0) return -1; // every token must match somewhere
    total += s;
  }
  return total;
}

function matchesVariantFilters(p: Product, q: ProductQuery): boolean {
  const sizes = q.sizes ?? [];
  const colors = q.colors ?? [];
  if (sizes.length === 0 && colors.length === 0) return true;
  if (p.variants.length === 0) return false;
  return p.variants.some(
    (v) =>
      (sizes.length === 0 || (v.size !== null && sizes.includes(v.size))) &&
      (colors.length === 0 || (v.color !== null && colors.includes(v.color))) &&
      v.stock > 0,
  );
}

function computeFacets(products: Product[]): Facets {
  const sizes = new Set<string>();
  const colors = new Set<string>();
  const brands = new Set<string>();
  let min = Infinity;
  let max = 0;
  for (const p of products) {
    if (p.brand) brands.add(p.brand);
    for (const v of p.variants) {
      if (v.size) sizes.add(v.size);
      if (v.color) colors.add(v.color);
    }
    min = Math.min(min, p.price);
    max = Math.max(max, p.price);
  }
  return {
    sizes: sortSizes([...sizes]),
    colors: [...colors].sort(),
    brands: [...brands].sort((a, b) => a.localeCompare(b)),
    priceRange: { min: Number.isFinite(min) ? Math.floor(min) : 0, max: Math.ceil(max) },
  };
}

export function runProductQuery(all: Product[], q: ProductQuery): Paginated<Product> {
  const toks = tokens(q.q ?? "");
  const pageSize = Math.max(1, q.pageSize ?? DEFAULT_PAGE_SIZE);
  const page = Math.max(1, q.page ?? 1);

  const scored = all
    .filter((p) => p.status === "active")
    .filter((p) => q.categoryId === undefined || p.category_id === q.categoryId)
    .map((p) => ({ p, score: searchScore(p, toks) }))
    .filter((x) => toks.length === 0 || x.score >= 0);

  // Facets ignore the facet filters themselves so options don't vanish once selected.
  const facets = computeFacets(scored.map((x) => x.p));

  let rows = scored.filter(({ p }) => {
    if (q.minPrice !== undefined && p.price < q.minPrice) return false;
    if (q.maxPrice !== undefined && p.price > q.maxPrice) return false;
    if (q.brands?.length && !(p.brand && q.brands.includes(p.brand))) return false;
    if (q.minRating !== undefined && (p.rating_average ?? 0) < q.minRating) return false;
    if (q.inStockOnly && productStock(p) <= 0) return false;
    if (q.onSaleOnly && discountPercent(p.price, p.compare_at_price) === 0) return false;
    return matchesVariantFilters(p, q);
  });

  const byNewest = (a: Product, b: Product) => b.created_at.localeCompare(a.created_at) || b.id - a.id;
  const sort = q.sort ?? "relevance";
  rows = [...rows].sort((a, b) => {
    switch (sort) {
      case "price_asc":
        return a.p.price - b.p.price || byNewest(a.p, b.p);
      case "price_desc":
        return b.p.price - a.p.price || byNewest(a.p, b.p);
      case "rating":
        return (b.p.rating_average ?? 0) - (a.p.rating_average ?? 0) || (b.p.review_count ?? 0) - (a.p.review_count ?? 0);
      case "discount":
        return (
          discountPercent(b.p.price, b.p.compare_at_price) - discountPercent(a.p.price, a.p.compare_at_price) ||
          byNewest(a.p, b.p)
        );
      case "newest":
        return byNewest(a.p, b.p);
      case "relevance":
      default:
        return toks.length ? b.score - a.score || byNewest(a.p, b.p) : byNewest(a.p, b.p);
    }
  });

  const total = rows.length;
  const start = (page - 1) * pageSize;
  return {
    items: rows.slice(start, start + pageSize).map((r) => r.p),
    total,
    page,
    pageSize,
    facets,
  };
}
