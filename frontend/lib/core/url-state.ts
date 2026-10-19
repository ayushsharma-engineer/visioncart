import { PRODUCT_SORTS, type ProductQuery, type ProductSort } from "../../types/domain.ts";

/** Minimal read interface satisfied by URLSearchParams and Next's ReadonlyURLSearchParams. */
export interface ParamReader {
  get(name: string): string | null;
  getAll(name: string): string[];
}

function posInt(v: string | null): number | undefined {
  if (v === null || v === "") return undefined;
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : undefined;
}

function nonNeg(v: string | null): number | undefined {
  if (v === null || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

function list(p: ParamReader, key: string): string[] | undefined {
  const vals = p.getAll(key).map((s) => s.trim()).filter(Boolean);
  return vals.length ? [...new Set(vals)] : undefined;
}

export function parseProductQuery(p: ParamReader): ProductQuery {
  const sort = p.get("sort");
  const rating = nonNeg(p.get("rating"));
  const q = p.get("q")?.trim();
  return {
    q: q || undefined,
    categoryId: posInt(p.get("category")),
    minPrice: nonNeg(p.get("min")),
    maxPrice: nonNeg(p.get("max")),
    sizes: list(p, "size"),
    colors: list(p, "color"),
    brands: list(p, "brand"),
    minRating: rating && rating <= 5 ? rating : undefined,
    inStockOnly: p.get("instock") === "1" || undefined,
    onSaleOnly: p.get("sale") === "1" || undefined,
    sort: (PRODUCT_SORTS as readonly string[]).includes(sort ?? "") ? (sort as ProductSort) : undefined,
    page: posInt(p.get("page")),
  };
}

export function serializeProductQuery(q: ProductQuery): string {
  const s = new URLSearchParams();
  if (q.q) s.set("q", q.q);
  if (q.categoryId !== undefined) s.set("category", String(q.categoryId));
  if (q.minPrice !== undefined) s.set("min", String(q.minPrice));
  if (q.maxPrice !== undefined) s.set("max", String(q.maxPrice));
  q.sizes?.forEach((v) => s.append("size", v));
  q.colors?.forEach((v) => s.append("color", v));
  q.brands?.forEach((v) => s.append("brand", v));
  if (q.minRating) s.set("rating", String(q.minRating));
  if (q.inStockOnly) s.set("instock", "1");
  if (q.onSaleOnly) s.set("sale", "1");
  if (q.sort && q.sort !== "relevance") s.set("sort", q.sort);
  if (q.page && q.page > 1) s.set("page", String(q.page));
  return s.toString();
}

/** Number of active filter constraints (excludes q, sort, page). */
export function activeFilterCount(q: ProductQuery): number {
  return (
    (q.categoryId !== undefined ? 1 : 0) +
    (q.minPrice !== undefined || q.maxPrice !== undefined ? 1 : 0) +
    (q.sizes?.length ?? 0) +
    (q.colors?.length ?? 0) +
    (q.brands?.length ?? 0) +
    (q.minRating ? 1 : 0) +
    (q.inStockOnly ? 1 : 0) +
    (q.onSaleOnly ? 1 : 0)
  );
}
