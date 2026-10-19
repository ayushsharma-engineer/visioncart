import type {
  Address, AddressInput, Category, ID, Order, Paginated, Product, ProductQuery, Review, Seller,
} from "@/types/domain";
import type {
  AIChatRequest, AIChatResponse, OutfitRequest, OutfitResponse, RecommendationRequest, AIProductSuggestion,
} from "@/types/ai";

/**
 * Service contracts: what the UI needs from the backend, per domain.
 *
 * These are the SEAM between pages and data. Pages only ever import from
 * `@/lib/services`. When a backend endpoint ships, implement the matching
 * interface in a `<domain>.live.ts` and switch it on in `lib/services/index.ts`;
 * no page changes. Method shapes here are PROPOSALS for the backend team (see
 * INTEGRATION.md) — none of them correspond to an existing endpoint.
 */

export interface CallOptions {
  signal?: AbortSignal;
}

export interface CatalogService {
  listCategories(o?: CallOptions): Promise<Category[]>;
  listProducts(q: ProductQuery, o?: CallOptions): Promise<Paginated<Product>>;
  getProduct(id: ID, o?: CallOptions): Promise<Product>;
  getProductsByIds(ids: ID[], o?: CallOptions): Promise<Product[]>;
}

export interface ReviewService {
  list(productId: ID, o?: CallOptions): Promise<Review[]>;
  create(productId: ID, input: { rating: number; comment: string }): Promise<Review>;
}

export interface AddressService {
  list(o?: CallOptions): Promise<Address[]>;
  create(input: AddressInput): Promise<Address>;
  update(id: ID, input: AddressInput): Promise<Address>;
  remove(id: ID): Promise<void>;
  setDefault(id: ID): Promise<Address>;
}

/** payments.payment_method is free text (String(30)); these are the values the UI offers. */
export type PaymentMethod = "upi" | "card" | "netbanking" | "wallet" | "cod";

export interface CreateOrderInput {
  addressId: ID;
  paymentMethod: PaymentMethod;
  /** Server MUST re-price from the catalog; the client never sends trusted prices. */
  items: { productId: ID; variantId: ID | null; quantity: number }[];
}

export interface OrderService {
  list(o?: CallOptions): Promise<Order[]>;
  get(id: ID, o?: CallOptions): Promise<Order>;
  create(input: CreateOrderInput): Promise<Order>;
  cancel(id: ID): Promise<Order>;
}

/** Everything Razorpay Checkout.js needs. `amount` is in the smallest unit (paise). */
export interface RazorpayInit {
  provider: "razorpay";
  keyId: string;
  razorpayOrderId: string;
  amount: number;
  currency: string;
}

export interface RazorpaySuccess {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface PaymentService {
  /** Backend creates the Razorpay order (using RAZORPAY_KEY_SECRET, server-side only). */
  initiate(orderId: ID): Promise<RazorpayInit>;
  /** Backend verifies the HMAC signature, then marks payments/orders paid. */
  verify(orderId: ID, payload: RazorpaySuccess): Promise<Order>;
}

export interface SellerVariantInput {
  id?: ID;
  sku: string;
  size: string | null;
  color: string | null;
  stock: number;
  image_url: string | null;
}

export interface SellerProductInput {
  name: string;
  description: string | null;
  category_id: ID;
  price: number;
  stock: number;
  image_url: string | null;
  status: string;
  variants: SellerVariantInput[];
}

export interface SellerSaleLine {
  orderId: ID;
  orderStatus: string;
  createdAt: string;
  productId: ID;
  productName: string;
  quantity: number;
  subtotal: number;
}

export interface SellerService {
  /** null = signed-in user has no seller profile yet. */
  getMe(o?: CallOptions): Promise<Seller | null>;
  register(input: { store_name: string; description: string | null }): Promise<Seller>;
  listProducts(o?: CallOptions): Promise<Product[]>;
  getProduct(id: ID, o?: CallOptions): Promise<Product>;
  createProduct(input: SellerProductInput): Promise<Product>;
  updateProduct(id: ID, input: SellerProductInput): Promise<Product>;
  deleteProduct(id: ID): Promise<void>;
  listSales(o?: CallOptions): Promise<SellerSaleLine[]>;
}

export interface AIService {
  chat(req: AIChatRequest, o?: CallOptions): Promise<AIChatResponse>;
  suggestOutfits(req: OutfitRequest, o?: CallOptions): Promise<OutfitResponse>;
  recommend(req: RecommendationRequest, o?: CallOptions): Promise<AIProductSuggestion[]>;
}
