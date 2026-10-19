import { config } from "../config";
import { fixtureCatalog, fixtureReviews } from "../fixtures/catalog-service";
import { makeUnavailable } from "./unavailable";
import type {
  AddressService, AIService, CatalogService, OrderService, PaymentService, ReviewService, SellerService,
} from "./types";

export * from "./types";

/**
 * Service registry — the single place that decides what backs each domain.
 *
 * To connect a real endpoint: write `<domain>.live.ts` implementing the interface from
 * ./types (use `request()` from lib/http/client), then replace the `unavailable` line below.
 * Pages never change.
 */

const fixtures = config.dataMode === "fixtures";

export const catalog: CatalogService = fixtures
  ? fixtureCatalog
  : makeUnavailable<CatalogService>("Product catalog", [
      "GET categories (list)",
      "GET products with search/filter/sort/pagination (see ProductQuery)",
      "GET product by id including variants",
    ]);

export const reviews: ReviewService = fixtures
  ? fixtureReviews
  : makeUnavailable<ReviewService>("Reviews", [
      "GET reviews for a product",
      "POST a review (authenticated)",
    ]);

export const addresses: AddressService = makeUnavailable<AddressService>("Addresses", [
  "CRUD for the signed-in user's addresses (addresses table exists; no API)",
]);

export const orders: OrderService = makeUnavailable<OrderService>("Orders", [
  "POST create order from cart lines (server re-prices, checks stock, writes orders + order_items)",
  "GET my orders / order detail",
  "order_items needs product_variant_id so size/colour are recorded",
]);

export const payments: PaymentService = makeUnavailable<PaymentService>("Payments", [
  "Create a Razorpay order for an order id (server-side, uses RAZORPAY_KEY_SECRET)",
  "Verify the Razorpay signature and mark the payment/order paid",
]);

export const seller: SellerService = makeUnavailable<SellerService>("Seller dashboard", [
  "Seller profile: get mine / register (sellers table exists; no API)",
  "Seller-scoped product + variant CRUD",
  "Seller order lines",
  "A way for the client to know the user is a seller (JWT has user_id only)",
]);

export const ai: AIService = makeUnavailable<AIService>("VisionCart AI", [
  "Chat endpoint returning structured blocks (see types/ai.ts)",
  "Outfit/budget suggestion endpoint",
  "Recommendation endpoint",
]);

/* ------------------------------------------------------------------ */
/* Honest status of every domain. Drives the dev banner + /dev/status. */
/* ------------------------------------------------------------------ */

export type DomainKey =
  | "auth" | "catalog" | "reviews" | "cart" | "wishlist"
  | "addresses" | "orders" | "payments" | "seller" | "ai";

export type IntegrationState = "live" | "fixtures" | "local" | "missing";

export interface IntegrationInfo {
  label: string;
  state: IntegrationState;
  detail: string;
}

export const integration: Record<DomainKey, IntegrationInfo> = {
  auth: { label: "Sign in / register / session", state: "live", detail: "Connected to /api/auth/*, POST /users and GET /profile." },
  catalog: fixtures
    ? { label: "Product catalog", state: "fixtures", detail: "Read-only sample data. No product API exists yet." }
    : { label: "Product catalog", state: "missing", detail: "No product/category endpoints in the backend." },
  reviews: fixtures
    ? { label: "Reviews", state: "fixtures", detail: "Sample reviews are readable; submitting is not connected." }
    : { label: "Reviews", state: "missing", detail: "No review endpoints in the backend." },
  cart: { label: "Cart", state: "local", detail: "Stored in this browser. The carts tables have no API." },
  wishlist: { label: "Wishlist", state: "local", detail: "Stored in this browser. There is no wishlist table or API." },
  addresses: { label: "Addresses", state: "missing", detail: "Table exists; no endpoints." },
  orders: { label: "Orders", state: "missing", detail: "Tables exist; no endpoints." },
  payments: { label: "Payments (Razorpay)", state: "missing", detail: "Keys exist in .env; no server integration." },
  seller: { label: "Seller dashboard", state: "missing", detail: "Tables exist; no endpoints or role check." },
  ai: { label: "VisionCart AI", state: "missing", detail: "AI modules exist server-side; none are exposed over HTTP." },
};

export function isAvailable(domain: DomainKey): boolean {
  const s = integration[domain].state;
  return s === "live" || s === "fixtures" || s === "local";
}
