/**
 * Runtime configuration. NEXT_PUBLIC_* values are inlined at BUILD time by Next.js,
 * so each must be referenced literally (no dynamic lookups).
 */

function num(raw: string | undefined, fallback: number): number {
  if (raw === undefined || raw === "") return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

const isProduction = process.env.NODE_ENV === "production";
const requestedMode = process.env.NEXT_PUBLIC_DATA_MODE === "fixtures" ? "fixtures" : "live";
const allowFixturesInProd = process.env.NEXT_PUBLIC_ALLOW_FIXTURES_IN_PRODUCTION === "true";

export type DataMode = "live" | "fixtures";

/** Fixtures are NEVER active in a production build unless explicitly allowed for a demo. */
const dataMode: DataMode =
  requestedMode === "fixtures" && (!isProduction || allowFixturesInProd) ? "fixtures" : "live";

export const config = {
  appName: "VisionCart",
  isDev: !isProduction,
  dataMode,
  /** Requested fixtures but they were blocked because this is a production build. */
  fixturesBlocked: requestedMode === "fixtures" && !(!isProduction || allowFixturesInProd),

  currency: process.env.NEXT_PUBLIC_CURRENCY ?? "INR",
  locale: process.env.NEXT_PUBLIC_LOCALE ?? "en-IN",

  // Storefront policy. The backend has no settings endpoint yet, so these live here.
  // NOTE: the orders table stores a single total_amount, so shipping can't be persisted separately.
  freeShippingThreshold: num(process.env.NEXT_PUBLIC_FREE_SHIPPING_THRESHOLD, 499),
  shippingFee: num(process.env.NEXT_PUBLIC_SHIPPING_FEE, 49),
  returnDays: num(process.env.NEXT_PUBLIC_RETURN_DAYS, 7),

  maxQuantityPerLine: 10,
  pageSize: 12,
} as const;
