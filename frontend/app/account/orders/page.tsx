"use client";

import Link from "next/link";
import { orders } from "@/lib/services";
import { useAsync } from "@/lib/hooks/use-async";
import { useDocumentTitle } from "@/lib/hooks/misc";
import { formatDate, pluralize } from "@/lib/core/utils";
import { money } from "@/lib/format";
import { SafeImage } from "@/components/ui/safe-image";
import { OrderStatusBadge } from "@/components/ui/status-badge";
import { AsyncError, EmptyState } from "@/components/ui/states";
import { Skeleton } from "@/components/ui/skeleton";
import { Icon } from "@/components/ui/icon";

export default function OrdersPage() {
  useDocumentTitle("My orders");
  const { data, error, loading, reload } = useAsync("orders", (s) => orders.list({ signal: s }));

  return (
    <section>
      <h2 className="font-display text-2xl font-semibold">Your orders</h2>
      <div className="mt-6">
        {error ? <AsyncError error={error} onRetry={reload} />
          : loading && !data ? <div className="space-y-4"><Skeleton className="h-32" /><Skeleton className="h-32" /></div>
          : !data || data.length === 0 ? <EmptyState icon="package" title="No orders yet" text="When you place an order it will show up here." action={{ label: "Start shopping", href: "/shop" }} />
          : (
            <ul className="space-y-4">
              {[...data].sort((a, b) => b.created_at.localeCompare(a.created_at)).map((o) => (
                <li key={o.id}>
                  <Link href={`/account/orders/${o.id}`} className="block rounded-3xl border border-line bg-surface p-5 transition hover:border-line-strong hover:shadow-card">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div><p className="text-sm font-semibold">Order #{o.id}</p><p className="text-xs text-muted">Placed {formatDate(o.created_at)}</p></div>
                      <div className="flex items-center gap-3"><OrderStatusBadge status={o.status} /><span className="font-semibold">{money(o.total_amount)}</span><Icon name="chevron-right" size={18} className="text-muted" /></div>
                    </div>
                    <div className="mt-4 flex items-center gap-2">
                      {o.items.slice(0, 4).map((it) => <SafeImage key={it.id} src={it.product?.image_url} alt={it.product?.name ?? "Item"} width={120} className="size-14 rounded-xl" />)}
                      <span className="ml-2 text-xs text-muted">{pluralize(o.items.reduce((n, i) => n + i.quantity, 0), "item")}</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
      </div>
    </section>
  );
}
