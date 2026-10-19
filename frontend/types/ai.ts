/**
 * AI contracts — PROPOSED frontend contracts, no backend endpoints exist yet.
 *
 * `ShoppingIntent` mirrors backend/app/ai/schemas/intent.py so the intent the
 * backend already extracts can be echoed back and rendered as filter chips.
 * Everything else is a proposal: the backend should conform to it, or a mapper
 * should be added in lib/services/ai.ts. Nothing here implements AI.
 */
import type { ID, Product } from "./domain";

export interface ShoppingIntent {
  intent_type: string;
  category?: string | null;
  subcategory?: string | null;
  budget_min?: number | null;
  budget_max?: number | null;
  gender?: string | null;
  size?: string | null;
  color?: string | null;
  brand?: string | null;
  occasion?: string | null;
  season?: string | null;
  weather?: string | null;
  style?: string | null;
  material?: string | null;
  fit?: string | null;
  constraints: string[];
  preferences: string[];
}

/** What the shopper told us in the side panel; sent along with each request. */
export interface ShoppingContext {
  budgetMax?: number;
  budgetMin?: number;
  gender?: string;
  occasion?: string;
  size?: string;
  style?: string;
}

export type OutfitRole =
  | "top"
  | "bottom"
  | "dress"
  | "outerwear"
  | "footwear"
  | "bag"
  | "accessory"
  | "beauty";

export interface AIProductSuggestion {
  product: Product;
  reason: string;
  score?: number;
  evidence?: string[];
}

export interface AIOutfitItem {
  role: OutfitRole;
  product: Product;
  reason?: string;
}

export interface AIOutfit {
  id: string;
  title: string;
  occasion?: string;
  description?: string;
  items: AIOutfitItem[];
  total_price: number;
  within_budget: boolean;
}

export interface BudgetBreakdown {
  budget: number;
  spent: number;
  remaining: number;
  allocation: { role: OutfitRole; amount: number }[];
}

export type AIBlock =
  | { type: "text"; text: string }
  | { type: "products"; title?: string; items: AIProductSuggestion[] }
  | { type: "outfits"; title?: string; outfits: AIOutfit[] }
  | { type: "budget"; breakdown: BudgetBreakdown }
  | { type: "followups"; suggestions: string[] };

export interface AIChatRequest {
  conversationId?: string;
  message: string;
  context?: ShoppingContext;
}

export interface AIChatResponse {
  conversationId: string;
  messageId: string;
  blocks: AIBlock[];
  intent?: ShoppingIntent;
}

export interface OutfitRequest {
  budgetMax: number;
  budgetMin?: number;
  occasion?: string;
  style?: string;
  gender?: string;
  size?: string;
  /** Products the shopper has already pinned; the AI should build around them. */
  anchorProductIds?: ID[];
}

export interface OutfitResponse {
  outfits: AIOutfit[];
  breakdown?: BudgetBreakdown;
}

export interface RecommendationRequest {
  context: "home" | "product" | "cart" | "wishlist";
  productId?: ID;
  limit?: number;
}
