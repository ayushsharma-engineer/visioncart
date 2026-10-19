"use client";

import { seller } from "@/lib/services";
import { useAsync } from "@/lib/hooks/use-async";
import { useDocumentTitle } from "@/lib/hooks/misc";
import { productStock } from "@/lib/core/variants";
import { money } from "@/lib/format";
import { ButtonLink } from "@/components/ui/button";
import { AsyncError } from "@/components/ui/states";
import { Skeleton } from "@/components/ui/skeleton";
import { Icon } from "@/components/ui/icon";

export default function SellerOverview() {
  useDocumentTitle("Seller dashboard");
  const { data, error, loading, reload } = useAsync("seller:overview", async (s) => ({ products: await seller.listProducts({ signal: s }), sales: await seller.listSales({ signal: s }) }));
  if (error) return <AsyncError error={error} onRetry={reload} />;
  if (loading && !data) return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-28" />)}</div>;
  if (!data) return null;

  const active = data.products.filter((p) => p.status === "active").length;
  const low = data.products.filter((p) => { const s = productStock(p); return s > 0 && s <= 5; }).length;
  const out = data.products.filter((p) => productStock(p) <= 0).length;
  const revenue = data.sales.filter((l) => l.orderStatus !== "cancelled").reduce((s, l) => s + l.subtotal, 0);
  const stats = [["Products", String(data.products.length), `${active} active`], ["Low stock", String(low), "5 or fewer left"], ["Sold out", String(out), "Need restocking"], ["Sales", money(revenue), `${data.sales.length} order lines`]];

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(([l, v, h]) => <div key={l} className="rounded-3xl border border-line bg-surface p-5"><p className="text-sm text-muted">{l}</p><p className="mt-2 font-display text-3xl font-semibold">{v}</p><p className="mt-1 text-xs text-muted">{h}</p></div>)}
      </div>
      <ButtonLink href="/seller/products/new" variant="primary"><Icon name="plus" size={16} />Add a product</ButtonLink>
    </div>
  );
}
