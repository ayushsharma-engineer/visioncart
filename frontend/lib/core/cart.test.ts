import { test } from "node:test";
import assert from "node:assert/strict";
import { addLine, setQuantity, removeLine, cartTotals, lineKey, sanitizeLines } from "./cart.ts";
import type { CartLine } from "../../types/domain.ts";

const line = (over: Partial<CartLine> = {}): CartLine => ({
  productId: 1, variantId: 10, quantity: 1, name: "Dress", price: 1000,
  image: null, size: "M", color: "Red", brand: null, maxQuantity: 5, ...over,
});
const policy = { freeShippingThreshold: 499, shippingFee: 49 };

test("addLine merges the same product+variant and sums quantity", () => {
  const a = addLine([], line({ quantity: 2 }));
  const b = addLine(a, line({ quantity: 1 }));
  assert.equal(b.length, 1);
  assert.equal(b[0].quantity, 3);
});

test("addLine keeps different variants of one product as separate lines", () => {
  const a = addLine([], line({ variantId: 10 }));
  const b = addLine(a, line({ variantId: 11, size: "L" }));
  assert.equal(b.length, 2);
});

test("quantity is capped by stock and by the per-line maximum", () => {
  const a = addLine([], line({ quantity: 9, maxQuantity: 3 }));
  assert.equal(a[0].quantity, 3);
  const b = addLine(a, line({ quantity: 5, maxQuantity: 3 }));
  assert.equal(b[0].quantity, 3);
  const c = addLine([], line({ quantity: 50, maxQuantity: 0 }), 10); // unknown stock -> hard cap
  assert.equal(c[0].quantity, 10);
});

test("setQuantity clamps, and <=0 removes the line", () => {
  const a = [line({ quantity: 2 })];
  assert.equal(setQuantity(a, lineKey(a[0]), 4)[0].quantity, 4);
  assert.equal(setQuantity(a, lineKey(a[0]), 99)[0].quantity, 5);
  assert.equal(setQuantity(a, lineKey(a[0]), 0).length, 0);
});

test("removeLine", () => {
  const a = [line(), line({ variantId: 11 })];
  assert.equal(removeLine(a, lineKey(a[0])).length, 1);
});

test("totals: delivery fee below threshold, free at/above it", () => {
  const below = cartTotals([line({ price: 400, quantity: 1 })], policy);
  assert.equal(below.shipping, 49);
  assert.equal(below.total, 449);
  assert.equal(below.remainingForFreeShipping, 99);

  const at = cartTotals([line({ price: 499, quantity: 1 })], policy);
  assert.equal(at.shipping, 0);
  assert.equal(at.remainingForFreeShipping, 0);
});

test("totals: empty cart costs nothing; rounding is paise-safe", () => {
  const empty = cartTotals([], policy);
  assert.deepEqual(empty, { itemCount: 0, subtotal: 0, shipping: 0, total: 0, remainingForFreeShipping: 0 });
  const t = cartTotals([line({ price: 0.1, quantity: 3 }), line({ variantId: 2, price: 0.2, quantity: 1 })], { freeShippingThreshold: 0, shippingFee: 0 });
  assert.equal(t.subtotal, 0.5);
});

test("sanitizeLines drops corrupt entries rather than throwing", () => {
  const out = sanitizeLines([line(), null, "x", { productId: "1" }, { ...line(), quantity: 0 }, { ...line(), price: NaN }]);
  assert.equal(out.length, 1);
  assert.deepEqual(sanitizeLines("not an array"), []);
});
