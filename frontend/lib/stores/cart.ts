"use client";

import { useMemo } from "react";
import type { CartLine } from "@/types/domain";
import { addLine, cartTotals, removeLine, sanitizeLines, setQuantity } from "../core/cart";
import { config } from "../config";
import { createPersistentStore } from "./persistent";

/**
 * Client-side cart (the standard guest-cart pattern).
 *
 * The DB has carts/cart_items per user but NO endpoints, so this is browser-only.
 * Prices here are a display snapshot; the server must re-price at order creation.
 * When a cart API exists, merge this cart into the server cart on login.
 */
const EMPTY: CartLine[] = [];
const store = createPersistentStore<CartLine[]>("vc.cart.v1", EMPTY, sanitizeLines);

export const cartActions = {
  add: (line: CartLine) => store.update((l) => addLine(l, line, config.maxQuantityPerLine)),
  setQuantity: (key: string, qty: number) =>
    store.update((l) => setQuantity(l, key, qty, config.maxQuantityPerLine)),
  remove: (key: string) => store.update((l) => removeLine(l, key)),
  clear: () => store.set(EMPTY),
};

export function useCart() {
  const lines = store.use();
  const totals = useMemo(
    () => cartTotals(lines, { freeShippingThreshold: config.freeShippingThreshold, shippingFee: config.shippingFee }),
    [lines],
  );
  return { lines, totals, ...cartActions };
}
