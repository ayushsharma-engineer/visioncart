import { test } from "node:test";
import assert from "node:assert/strict";

import { normalizeErrorBody, ApiError } from "./errors.ts";
import { toNumber, formatMoney, discountPercent } from "./money.ts";
import { safeNextPath, initials } from "./utils.ts";
import * as v from "./validators.ts";
import { findVariant, isOptionAvailable, optionAxes, productStock, sortSizes, galleryImages } from "./variants.ts";
import { runProductQuery } from "./catalog-query.ts";
import { parseProductQuery, serializeProductQuery, activeFilterCount } from "./url-state.ts";
import type { Product, ProductVariant } from "../../types/domain.ts";

/* ---------------- errors: the three real backend shapes ---------------- */

test("normalizeErrorBody: AppException envelope", () => {
  const e = normalizeErrorBody(401, { success: false, error: { code: "INVALID_CREDENTIALS", message: "Invalid email or password" } });
  assert.ok(e instanceof ApiError);
  assert.equal(e.status, 401);
  assert.equal(e.code, "INVALID_CREDENTIALS");
  assert.equal(e.message, "Invalid email or password");
});

test("normalizeErrorBody: FastAPI HTTPException {detail: string}", () => {
  const e = normalizeErrorBody(401, { detail: "Invalid or expired token" });
  assert.equal(e.message, "Invalid or expired token");
  assert.equal(e.code, "HTTP_401");
});

test("normalizeErrorBody: Pydantic 422 list becomes per-field messages", () => {
  const e = normalizeErrorBody(422, {
    detail: [
      { loc: ["body", "email"], msg: "field required", type: "missing" },
      { loc: ["body", "password"], msg: "too short", type: "x" },
    ],
  });
  assert.equal(e.code, "VALIDATION_ERROR");
  assert.deepEqual(e.fields, { email: "field required", password: "too short" });
  assert.equal(e.message, "field required");
});

test("normalizeErrorBody: non-JSON 500 never leaks raw body, gives friendly text", () => {
  const e = normalizeErrorBody(500, "Internal Server Error");
  assert.equal(e.status, 500);
  assert.match(e.message, /server ran into a problem/i);
});

test("normalizeErrorBody: unknown 404 falls back to generic copy", () => {
  assert.match(normalizeErrorBody(404, null).message, /couldn't find/i);
});

/* ---------------- money ---------------- */

test("toNumber handles Decimal-as-string from FastAPI", () => {
  assert.equal(toNumber("1599.00"), 1599);
  assert.equal(toNumber("1,599.50"), 1599.5);
  assert.equal(toNumber(42), 42);
  assert.equal(toNumber("abc", 7), 7);
  assert.equal(toNumber(undefined), 0);
  assert.equal(toNumber(NaN, 3), 3);
});

test("formatMoney uses Indian grouping and hides .00", () => {
  assert.equal(formatMoney(1599), "₹1,599");
  assert.equal(formatMoney(123456), "₹1,23,456");
  assert.equal(formatMoney(1599.5), "₹1,599.50");
});

test("formatMoney supports other currencies for international expansion", () => {
  assert.match(formatMoney(25, { currency: "USD", locale: "en-US" }), /\$25/);
});

test("discountPercent", () => {
  assert.equal(discountPercent(1599, 2499), 36);
  assert.equal(discountPercent(100, 100), 0);
  assert.equal(discountPercent(100, null), 0);
  assert.equal(discountPercent(200, 100), 0);
});

/* ---------------- utils ---------------- */

test("safeNextPath blocks open redirects", () => {
  assert.equal(safeNextPath("/checkout"), "/checkout");
  assert.equal(safeNextPath("/account/orders?x=1"), "/account/orders?x=1");
  assert.equal(safeNextPath("//evil.com"), "/");
  assert.equal(safeNextPath("https://evil.com"), "/");
  assert.equal(safeNextPath("/\\evil.com"), "/");
  assert.equal(safeNextPath("javascript:alert(1)"), "/");
  assert.equal(safeNextPath(null), "/");
  assert.equal(safeNextPath(undefined, "/home"), "/home");
});

test("initials", () => {
  assert.equal(initials("Raju Sewda"), "RS");
  assert.equal(initials("  madonna "), "M");
  assert.equal(initials(""), "?");
});

/* ---------------- validators ---------------- */

test("validators", () => {
  assert.equal(v.email("a@b.co"), null);
  assert.notEqual(v.email("a@b"), null);
  assert.notEqual(v.password("short"), null);
  assert.equal(v.password("longenough"), null);
  assert.equal(v.indianPhone("+91 98765-43210"), null);
  assert.equal(v.indianPhone("09876543210"), null);
  assert.notEqual(v.indianPhone("12345"), null);
  assert.notEqual(v.indianPhone("5876543210"), null); // must start 6-9
  assert.equal(v.indianPincode("302001"), null);
  assert.notEqual(v.indianPincode("012345"), null);
  assert.notEqual(v.indianPincode("30200"), null);
  assert.equal(v.firstError("", [v.required("Name"), v.email]), "Name is required");
});

/* ---------------- variants ---------------- */

const variant = (id: number, size: string | null, color: string | null, stock: number, image: string | null = null): ProductVariant => ({
  id, product_id: 1, sku: `SKU-${id}`, size, color, stock, image_url: image,
});

test("sortSizes orders letter, then numeric, then free-text sizes", () => {
  assert.deepEqual(sortSizes(["XL", "S", "One Size", "M", "UK 9", "UK 7"]), ["S", "M", "XL", "UK 7", "UK 9", "One Size"]);
});

test("findVariant / isOptionAvailable respect the other axis", () => {
  const vs = [variant(1, "M", "Red", 5), variant(2, "L", "Red", 0), variant(3, "L", "Blue", 2)];
  assert.equal(findVariant(vs, { size: "L", color: "Blue" })?.id, 3);
  assert.equal(findVariant(vs, { size: "L", color: "Green" }), undefined);
  // L is sold out in Red but available in Blue
  assert.equal(isOptionAvailable(vs, "size", "L", { color: "Red" }), false);
  assert.equal(isOptionAvailable(vs, "size", "L", { color: "Blue" }), true);
  assert.equal(isOptionAvailable(vs, "size", "L", {}), true);
  assert.deepEqual(optionAxes(vs), { sizes: ["M", "L"], colors: ["Red", "Blue"] });
});

test("findVariant ignores axes the product does not have", () => {
  const sizeOnly = [variant(1, "M", null, 1), variant(2, "L", null, 1)];
  assert.equal(findVariant(sizeOnly, { size: "L" })?.id, 2);
});

const product = (over: Partial<Product> & { id: number }): Product => ({
  seller_id: 1, name: "Item", description: null, category_id: 1, price: 1000, stock: 0,
  image_url: null, status: "active", created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z",
  variants: [], ...over,
});

test("productStock sums variants, else uses product stock", () => {
  assert.equal(productStock(product({ id: 1, stock: 9, variants: [variant(1, "M", null, 2), variant(2, "L", null, 3)] })), 5);
  assert.equal(productStock(product({ id: 2, stock: 9 })), 9);
  assert.equal(productStock(product({ id: 3, stock: -4 })), 0);
});

test("galleryImages puts the selected colour's image first and de-duplicates", () => {
  const p = product({ id: 1, image_url: "main.jpg", images: ["main.jpg", "alt.jpg"], variants: [variant(1, "M", "Red", 1, "red.jpg"), variant(2, "M", "Blue", 1, "blue.jpg")] });
  assert.deepEqual(galleryImages(p, "Blue"), ["blue.jpg", "main.jpg", "alt.jpg", "red.jpg"]);
  assert.deepEqual(galleryImages(p), ["main.jpg", "alt.jpg", "red.jpg", "blue.jpg"]);
});

/* ---------------- catalog query ---------------- */

const catalog: Product[] = [
  product({ id: 1, name: "Floral Summer Dress", brand: "Atelier", category_id: 1, category: { id: 1, name: "Women" }, price: 1599, compare_at_price: 2499, rating_average: 4.7, review_count: 100, created_at: "2026-03-01T00:00:00Z", variants: [variant(1, "S", "Pink", 3), variant(2, "M", "Pink", 0)] }),
  product({ id: 2, name: "Running Shoes", brand: "Stride", category_id: 2, category: { id: 2, name: "Footwear" }, price: 3999, rating_average: 4.1, review_count: 50, created_at: "2026-02-01T00:00:00Z", variants: [variant(3, "UK 8", "Black", 4)] }),
  product({ id: 3, name: "Linen Shirt", brand: "Atelier", category_id: 3, category: { id: 3, name: "Men" }, price: 1299, compare_at_price: 1999, rating_average: 4.5, review_count: 70, created_at: "2026-04-01T00:00:00Z", variants: [variant(4, "M", "White", 1), variant(5, "L", "Blue", 1)] }),
  product({ id: 4, name: "Hidden draft", status: "draft", price: 1 }),
  product({ id: 5, name: "Sold Out Tote", brand: "Stride", category_id: 4, category: { id: 4, name: "Bags" }, price: 800, stock: 0, created_at: "2026-05-01T00:00:00Z" }),
];

test("query: only active products are listed", () => {
  const r = runProductQuery(catalog, {});
  assert.equal(r.total, 4);
  assert.ok(!r.items.some((p) => p.status !== "active"));
});

test("query: search matches name/brand/category and requires every token", () => {
  assert.deepEqual(runProductQuery(catalog, { q: "dress" }).items.map((p) => p.id), [1]);
  assert.deepEqual(runProductQuery(catalog, { q: "atelier" }).items.map((p) => p.id).sort(), [1, 3]);
  assert.deepEqual(runProductQuery(catalog, { q: "footwear" }).items.map((p) => p.id), [2]);
  assert.equal(runProductQuery(catalog, { q: "dress shoes" }).total, 0);
  assert.equal(runProductQuery(catalog, { q: "zzzz" }).total, 0);
});

test("query: price, brand, rating, stock, sale filters", () => {
  assert.deepEqual(runProductQuery(catalog, { minPrice: 1500 }).items.map((p) => p.id).sort(), [1, 2]);
  assert.deepEqual(runProductQuery(catalog, { maxPrice: 1000 }).items.map((p) => p.id), [5]);
  assert.deepEqual(runProductQuery(catalog, { brands: ["Stride"] }).items.map((p) => p.id).sort(), [2, 5]);
  assert.deepEqual(runProductQuery(catalog, { minRating: 4.5 }).items.map((p) => p.id).sort(), [1, 3]);
  assert.ok(!runProductQuery(catalog, { inStockOnly: true }).items.some((p) => p.id === 5));
  assert.deepEqual(runProductQuery(catalog, { onSaleOnly: true }).items.map((p) => p.id).sort(), [1, 3]);
});

test("query: size/colour filters use ONE in-stock variant satisfying both", () => {
  // Dress has Pink/S in stock and Pink/M sold out
  assert.deepEqual(runProductQuery(catalog, { sizes: ["S"] }).items.map((p) => p.id), [1]);
  assert.equal(runProductQuery(catalog, { sizes: ["M"], colors: ["Pink"] }).total, 0);
  assert.deepEqual(runProductQuery(catalog, { sizes: ["M"], colors: ["White"] }).items.map((p) => p.id), [3]);
  // variant-less product can't satisfy a size filter
  assert.ok(!runProductQuery(catalog, { sizes: ["M"] }).items.some((p) => p.id === 5));
});

test("query: sorting", () => {
  const ids = (sort: Parameters<typeof runProductQuery>[1]["sort"]) => runProductQuery(catalog, { sort }).items.map((p) => p.id);
  assert.deepEqual(ids("price_asc"), [5, 3, 1, 2]);
  assert.deepEqual(ids("price_desc"), [2, 1, 3, 5]);
  assert.deepEqual(ids("newest"), [5, 3, 1, 2]);
  assert.equal(ids("rating")[0], 1);
  assert.deepEqual(ids("discount").slice(0, 2), [1, 3]); // 36% then 35%
});

test("query: pagination and facets", () => {
  const r = runProductQuery(catalog, { page: 2, pageSize: 3 });
  assert.equal(r.items.length, 1);
  assert.equal(r.total, 4);
  assert.deepEqual(r.facets?.brands, ["Atelier", "Stride"]);
  assert.deepEqual(r.facets?.sizes, ["S", "M", "L", "UK 8"]);
  assert.equal(r.facets?.priceRange.min, 800);
  assert.equal(r.facets?.priceRange.max, 3999);
});

test("query: facets are not narrowed by the user's own facet selections", () => {
  const r = runProductQuery(catalog, { brands: ["Stride"] });
  assert.deepEqual(r.facets?.brands, ["Atelier", "Stride"]);
});

/* ---------------- url state ---------------- */

test("url-state round-trips and drops defaults", () => {
  const q = { q: "red dress", categoryId: 3, minPrice: 500, maxPrice: 3000, sizes: ["M", "L"], colors: ["Red"], brands: ["Atelier"], minRating: 4, inStockOnly: true, sort: "price_asc" as const, page: 2 };
  const qs = serializeProductQuery(q);
  const back = parseProductQuery(new URLSearchParams(qs));
  assert.deepEqual(back, { ...q, onSaleOnly: undefined });
  assert.equal(serializeProductQuery({ sort: "relevance", page: 1 }), "");
});

test("url-state ignores garbage values instead of throwing", () => {
  const q = parseProductQuery(new URLSearchParams("category=abc&min=-5&max=x&sort=hax&page=0&rating=9"));
  assert.equal(q.categoryId, undefined);
  assert.equal(q.minPrice, undefined);
  assert.equal(q.maxPrice, undefined);
  assert.equal(q.sort, undefined);
  assert.equal(q.page, undefined);
  assert.equal(q.minRating, undefined);
});

test("activeFilterCount", () => {
  assert.equal(activeFilterCount({ q: "x", sort: "price_asc", page: 3 }), 0);
  assert.equal(activeFilterCount({ categoryId: 1, minPrice: 1, maxPrice: 9, sizes: ["M", "L"], inStockOnly: true }), 5);
});
