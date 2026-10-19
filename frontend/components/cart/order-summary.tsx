import type { CartTotals } from "@/lib/core/cart";
import { config } from "@/lib/config";
import { money } from "@/lib/format";

export function OrderSummary({ totals, children }: { totals: CartTotals; children?: React.ReactNode }) {
  const pct = Math.min(100, (totals.subtotal / config.freeShippingThreshold) * 100);
  return (
    <aside aria-label="Order summary" className="rounded-3xl border border-line bg-surface p-6">
      <h2 className="font-display text-xl font-semibold">Order summary</h2>
      {totals.itemCount > 0 && totals.remainingForFreeShipping > 0 && (
        <div className="mt-4 rounded-2xl bg-sunken p-4 text-sm">
          <p>Add <strong>{money(totals.remainingForFreeShipping)}</strong> more for free delivery</p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} aria-label="Progress to free delivery"><div className="h-full rounded-full bg-success transition-all" style={{ width: `${pct}%` }} /></div>
        </div>
      )}
      <dl className="mt-5 space-y-3 text-sm">
        <div className="flex justify-between"><dt className="text-muted">Subtotal ({totals.itemCount} {totals.itemCount === 1 ? "item" : "items"})</dt><dd className="font-medium">{money(totals.subtotal)}</dd></div>
        <div className="flex justify-between"><dt className="text-muted">Delivery</dt><dd className="font-medium">{totals.shipping === 0 ? <span className="text-success">Free</span> : money(totals.shipping)}</dd></div>
        <div className="flex justify-between border-t border-line pt-4 text-base"><dt className="font-semibold">Total</dt><dd className="font-semibold">{money(totals.total)}</dd></div>
      </dl>
      <p className="mt-1 text-xs text-muted">Inclusive of all taxes</p>
      {children && <div className="mt-6">{children}</div>}
    </aside>
  );
}
