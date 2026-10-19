"use client";

import type { WishlistEntry } from "@/types/domain";
import { createPersistentStore } from "./persistent";

/**
 * Wishlist is saved on THIS DEVICE only. There is no wishlist table or endpoint yet
 * (see INTEGRATION.md); the UI says "saved on this device" rather than implying sync.
 */
function sanitize(raw: unknown): WishlistEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (e): e is WishlistEntry =>
      !!e && typeof e === "object" && typeof (e as WishlistEntry).productId === "number" && typeof (e as WishlistEntry).name === "string",
  );
}

const EMPTY: WishlistEntry[] = [];
const store = createPersistentStore<WishlistEntry[]>("vc.wishlist.v1", EMPTY, sanitize);

export const wishlistActions = {
  toggle(entry: Omit<WishlistEntry, "addedAt">) {
    store.update((list) =>
      list.some((e) => e.productId === entry.productId)
        ? list.filter((e) => e.productId !== entry.productId)
        : [{ ...entry, addedAt: Date.now() }, ...list],
    );
  },
  remove: (productId: number) => store.update((l) => l.filter((e) => e.productId !== productId)),
  clear: () => store.set(EMPTY),
};

export function useWishlist() {
  const entries = store.use();
  return { entries, has: (id: number) => entries.some((e) => e.productId === id), ...wishlistActions };
}
