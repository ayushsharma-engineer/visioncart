/**
 * Domain types.
 *
 * Fields WITHOUT a comment mirror the backend SQLAlchemy models in
 * backend/app/models/*.py exactly. Fields marked "NOT IN DB" are things the
 * storefront UI wants but the schema cannot store yet; they are optional so the
 * UI degrades gracefully when the real API returns only the base columns.
 * See INTEGRATION.md for the schema-gap list.
 *
 * NOTE: Numeric(10,2) columns serialise as JSON *strings* from FastAPI/Pydantic v2
 * ("1599.00"). Live adapters must pass money through `toNumber()` (lib/core/money).
 */

export type ID = number;

export interface Category {
  id: ID;
  name: string;
  created_at?: string;
  /** NOT IN DB: category cover image. */
  image_url?: string | null;
}

export interface ProductVariant {
  id: ID;
  product_id: ID;
  sku: string;
  size: string | null;
  color: string | null;
  stock: number;
  image_url: string | null;
  created_at?: string;
  updated_at?: string;
}

/** Structured attributes. Shape follows backend/app/ai/schemas/product.py (ProductIntelligence). NOT IN DB yet. */
export interface ProductAttributes {
  material?: string | null;
  composition?: string | null;
  fit?: string | null;
  care_instructions?: string | null;
  formality?: string | null;
  occasions?: string[];
  styles?: string[];
  patterns?: string[];
  suitable_seasons?: string[];
  suitable_weather?: string[];
}

export type ProductStatus = "active" | "inactive" | "draft" | (string & {});

export interface Product {
  id: ID;
  seller_id: ID;
  name: string;
  description: string | null;
  category_id: ID;
  price: number;
  /** Product-level stock. When variants exist, availability is derived from variants. */
  stock: number;
  image_url: string | null;
  status: ProductStatus;
  created_at: string;
  updated_at: string;
  variants: ProductVariant[];

  category?: Category;
  /** NOT IN DB */ brand?: string | null;
  /** NOT IN DB: original price, used to show a discount. */ compare_at_price?: number | null;
  /** NOT IN DB: gallery. Falls back to [image_url, ...variant images]. */ images?: string[];
  /** NOT IN DB: aggregate; can be derived from `reviews` later. */ rating_average?: number | null;
  /** NOT IN DB */ review_count?: number;
  /** NOT IN DB */ attributes?: ProductAttributes;
  /** NOT IN DB: join with sellers.store_name. */ seller_name?: string | null;
}

export interface Review {
  id: ID;
  product_id: ID;
  user_id: ID;
  rating: number;
  comment: string | null;
  status: string;
  created_at: string;
  updated_at?: string;
  /** NOT IN DB: join with users.name. */
  author_name?: string | null;
}

export interface Address {
  id: ID;
  user_id: ID;
  full_name: string;
  phone: string;
  address_line: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default: boolean;
  created_at?: string;
  updated_at?: string;
}
export type AddressInput = Omit<Address, "id" | "user_id" | "created_at" | "updated_at">;

export interface OrderItem {
  id: ID;
  order_id: ID;
  product_id: ID;
  quantity: number;
  unit_price: number;
  subtotal: number;
  /** Joined product snapshot for display. */
  product?: Pick<Product, "id" | "name" | "image_url" | "brand">;
  /**
   * NOT IN DB: order_items has product_id but NO product_variant_id, so an order
   * cannot record which size/colour was bought. Critical schema gap.
   */
  variant_id?: ID;
  size?: string | null;
  color?: string | null;
}

export interface Payment {
  id: ID;
  order_id: ID;
  amount: number;
  payment_method: string;
  status: string;
  transaction_id: string | null;
  created_at?: string;
}

/** Free-text in the DB (default "pending"); the UI maps known values and tolerates unknown ones. */
export type OrderStatus = "pending" | "confirmed" | "shipped" | "delivered" | "cancelled" | (string & {});
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded" | (string & {});

export interface Order {
  id: ID;
  user_id: ID;
  address_id: ID;
  total_amount: number;
  status: OrderStatus;
  payment_status: PaymentStatus;
  created_at: string;
  updated_at?: string;
  items: OrderItem[];
  address?: Address;
  payment?: Payment | null;
}

export interface Seller {
  id: ID;
  user_id: ID;
  store_name: string;
  description: string | null;
  status: string;
  created_at?: string;
}

export interface SessionUser {
  id: ID;
  name: string;
  email: string;
}

/* ---------- catalog querying ---------- */

export const PRODUCT_SORTS = [
  "relevance",
  "newest",
  "price_asc",
  "price_desc",
  "rating",
  "discount",
] as const;
export type ProductSort = (typeof PRODUCT_SORTS)[number];

export interface ProductQuery {
  q?: string;
  categoryId?: ID;
  minPrice?: number;
  maxPrice?: number;
  sizes?: string[];
  colors?: string[];
  brands?: string[];
  minRating?: number;
  inStockOnly?: boolean;
  onSaleOnly?: boolean;
  sort?: ProductSort;
  page?: number;
  pageSize?: number;
}

export interface Facets {
  sizes: string[];
  colors: string[];
  brands: string[];
  priceRange: { min: number; max: number };
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  facets?: Facets;
}

/* ---------- cart & wishlist (client-side, see lib/stores) ---------- */

export interface CartLine {
  variantId: ID | null; // null for products without variants
  productId: ID;
  quantity: number;
  /** Display snapshot taken when added. The server MUST re-price at checkout. */
  name: string;
  price: number;
  image: string | null;
  size: string | null;
  color: string | null;
  brand: string | null;
  maxQuantity: number;
}

export interface WishlistEntry {
  productId: ID;
  addedAt: number;
  name: string;
  price: number;
  image: string | null;
  brand: string | null;
}
