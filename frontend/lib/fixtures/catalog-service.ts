import { ApiError } from "../core/errors";
import { runProductQuery } from "../core/catalog-query";
import { makeUnavailable } from "../services/unavailable";
import type { CatalogService, ReviewService } from "../services/types";
import { FIXTURE_CATEGORIES, FIXTURE_PRODUCTS, FIXTURE_REVIEWS } from "./catalog-data";

/** Simulates network latency so skeletons and loading states are exercised during UI review. */
const latency = (ms = 180) => new Promise<void>((r) => setTimeout(r, ms));

export const fixtureCatalog: CatalogService = {
  async listCategories() {
    await latency(80);
    return FIXTURE_CATEGORIES;
  },
  async listProducts(q) {
    await latency();
    return runProductQuery(FIXTURE_PRODUCTS, q);
  },
  async getProduct(id) {
    await latency();
    const p = FIXTURE_PRODUCTS.find((x) => x.id === id && x.status === "active");
    if (!p) throw new ApiError(404, "PRODUCT_NOT_FOUND", "We couldn't find that product.");
    return p;
  },
  async getProductsByIds(ids) {
    await latency(100);
    const set = new Set(ids);
    return FIXTURE_PRODUCTS.filter((p) => set.has(p.id) && p.status === "active");
  },
};

/** Reads work from fixtures; WRITING a review is a real backend action and stays unavailable. */
const reviewWrites = makeUnavailable<ReviewService>("Reviews", [
  "An authenticated endpoint to create a review for a product (reviews table exists; no API).",
]);

export const fixtureReviews: ReviewService = {
  async list(productId) {
    await latency(120);
    return FIXTURE_REVIEWS.filter((r) => r.product_id === productId);
  },
  create: (...args) => reviewWrites.create(...args),
};
