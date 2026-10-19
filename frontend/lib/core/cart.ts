import type { CartLine } from "../../types/domain.ts";

export function lineKey(l: Pick<CartLine, "productId" | "variantId">): string {
  return `${l.productId}:${l.variantId ?? "x"}`;
}

function cap(quantity: number, maxQuantity: number, hardMax: number): number {
  const limit = maxQuantity > 0 ? Math.min(maxQuantity, hardMax) : hardMax;
  return Math.max(1, Math.min(quantity, limit));
}

/** Adding an existing line increases its quantity; quantity never exceeds stock or the per-line cap. */
export function addLine(lines: CartLine[], incoming: CartLine, hardMax = 10): CartLine[] {
  const key = lineKey(incoming);
  const existing = lines.find((l) => lineKey(l) === key);
  if (!existing) {
    return [...lines, { ...incoming, quantity: cap(incoming.quantity, incoming.maxQuantity, hardMax) }];
  }
  return lines.map((l) =>
    lineKey(l) === key
      ? { ...l, ...incoming, quantity: cap(l.quantity + incoming.quantity, incoming.maxQuantity, hardMax) }
      : l,
  );
}

export function setQuantity(lines: CartLine[], key: string, quantity: number, hardMax = 10): CartLine[] {
  if (quantity <= 0) return lines.filter((l) => lineKey(l) !== key);
  return lines.map((l) => (lineKey(l) === key ? { ...l, quantity: cap(quantity, l.maxQuantity, hardMax) } : l));
}

export function removeLine(lines: CartLine[], key: string): CartLine[] {
  return lines.filter((l) => lineKey(l) !== key);
}

export interface CartPolicy {
  freeShippingThreshold: number;
  shippingFee: number;
}

export interface CartTotals {
  itemCount: number;
  subtotal: number;
  shipping: number;
  total: number;
  /** Amount still needed for free delivery; 0 when already free or cart empty. */
  remainingForFreeShipping: number;
}

export function cartTotals(lines: CartLine[], policy: CartPolicy): CartTotals {
  const itemCount = lines.reduce((n, l) => n + l.quantity, 0);
  const subtotal = Math.round(lines.reduce((s, l) => s + l.price * l.quantity, 0) * 100) / 100;
  const free = subtotal >= policy.freeShippingThreshold;
  const shipping = lines.length === 0 || free ? 0 : policy.shippingFee;
  return {
    itemCount,
    subtotal,
    shipping,
    total: Math.round((subtotal + shipping) * 100) / 100,
    remainingForFreeShipping:
      lines.length === 0 || free ? 0 : Math.max(0, policy.freeShippingThreshold - subtotal),
  };
}

/** Defensive parse of whatever is in localStorage. Drops malformed lines instead of crashing. */
export function sanitizeLines(raw: unknown): CartLine[] {
  if (!Array.isArray(raw)) return [];
  const out: CartLine[] = [];
  for (const r of raw) {
    if (!r || typeof r !== "object") continue;
    const l = r as Partial<CartLine>;
    if (
      typeof l.productId !== "number" ||
      typeof l.name !== "string" ||
      typeof l.price !== "number" ||
      !Number.isFinite(l.price) ||
      typeof l.quantity !== "number" ||
      l.quantity < 1
    )
      continue;
    out.push({
      productId: l.productId,
      variantId: typeof l.variantId === "number" ? l.variantId : null,
      quantity: Math.floor(l.quantity),
      name: l.name,
      price: l.price,
      image: typeof l.image === "string" ? l.image : null,
      size: typeof l.size === "string" ? l.size : null,
      color: typeof l.color === "string" ? l.color : null,
      brand: typeof l.brand === "string" ? l.brand : null,
      maxQuantity: typeof l.maxQuantity === "number" ? l.maxQuantity : 0,
    });
  }
  return out;
}
