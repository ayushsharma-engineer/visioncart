/** FastAPI serialises Decimal as a string ("1599.00"); accept both. */
export function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : fallback;
  if (typeof value === "string") {
    const n = Number(value.replace(/,/g, "").trim());
    return Number.isFinite(n) ? n : fallback;
  }
  return fallback;
}

export interface MoneyOptions {
  currency?: string;
  locale?: string;
}

export function formatMoney(amount: number, opts: MoneyOptions = {}): string {
  const { currency = "INR", locale = "en-IN" } = opts;
  const hasPaise = Math.round(amount * 100) % 100 !== 0;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: hasPaise ? 2 : 0,
    maximumFractionDigits: hasPaise ? 2 : 0,
  }).format(amount);
}

/** Integer percent off, or 0 when there is no real discount. */
export function discountPercent(price: number, compareAt?: number | null): number {
  if (!compareAt || compareAt <= price || compareAt <= 0) return 0;
  return Math.round(((compareAt - price) / compareAt) * 100);
}
