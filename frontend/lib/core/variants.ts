import type { Product, ProductVariant } from "../../types/domain.ts";

const SIZE_ORDER = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL"];

export function sizeRank(size: string): number {
  const s = size.trim().toUpperCase();
  const i = SIZE_ORDER.indexOf(s);
  if (i >= 0) return i;
  const n = Number(s.replace(/[^\d.]/g, ""));
  if (Number.isFinite(n) && /\d/.test(s)) return 100 + n; // numeric sizes (shoes, waist) after letters
  return 1000; // "One Size", free text
}

export function sortSizes(sizes: string[]): string[] {
  return [...sizes].sort((a, b) => sizeRank(a) - sizeRank(b) || a.localeCompare(b));
}

export interface OptionAxes {
  sizes: string[];
  colors: string[];
}

export function optionAxes(variants: ProductVariant[]): OptionAxes {
  const sizes = new Set<string>();
  const colors = new Set<string>();
  for (const v of variants) {
    if (v.size) sizes.add(v.size);
    if (v.color) colors.add(v.color);
  }
  return { sizes: sortSizes([...sizes]), colors: [...colors] };
}

export interface Selection {
  size?: string | null;
  color?: string | null;
}

/** Exact variant for the selection, or undefined. Axes the product doesn't have are ignored. */
export function findVariant(variants: ProductVariant[], sel: Selection): ProductVariant | undefined {
  const axes = optionAxes(variants);
  return variants.find(
    (v) =>
      (axes.sizes.length === 0 || v.size === (sel.size ?? null)) &&
      (axes.colors.length === 0 || v.color === (sel.color ?? null)),
  );
}

/**
 * Is `value` on `axis` purchasable given what is already chosen on the other axis?
 * Used to strike out sold-out sizes after a colour is picked, and vice versa.
 */
export function isOptionAvailable(
  variants: ProductVariant[],
  axis: "size" | "color",
  value: string,
  selected: Selection,
): boolean {
  return variants.some((v) => {
    if (v[axis] !== value) return false;
    if (axis === "size" && selected.color && v.color !== selected.color) return false;
    if (axis === "color" && selected.size && v.size !== selected.size) return false;
    return v.stock > 0;
  });
}

export function productStock(product: Pick<Product, "stock" | "variants">): number {
  return product.variants.length > 0
    ? product.variants.reduce((sum, v) => sum + Math.max(0, v.stock), 0)
    : Math.max(0, product.stock);
}

export function galleryImages(product: Product, color?: string | null): string[] {
  const out: string[] = [];
  const push = (u?: string | null) => {
    if (u && !out.includes(u)) out.push(u);
  };
  if (color) {
    for (const v of product.variants) if (v.color === color) push(v.image_url);
  }
  for (const u of product.images ?? []) push(u);
  push(product.image_url);
  for (const v of product.variants) push(v.image_url);
  return out;
}
