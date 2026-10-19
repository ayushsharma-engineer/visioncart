"use client";

import { seller } from "@/lib/services";
import { useAsync } from "@/lib/hooks/use-async";
import { useDocumentTitle } from "@/lib/hooks/misc";
import { formatDate } from "@/lib/core/utils";
import { money } from "@/lib/format";
import { OrderStatusBadge } from "@/components/ui/status-badge";
import { AsyncError, EmptyState } from "@/components/ui/states";
import { Skeleton } from "@/components/ui/skeleton";

export default function SellerOrders() {
  useDocumentTitle("Seller orders");
  const { data, error, loading, reload } = useAsync("seller:sales", (s) => seller.listSales({ signal: s }));
  return (
    <section><h2 className="font-display text-2xl font-semibold">Orders for your products</h2>
      <div className="mt-6">
        {error ? <AsyncError error={error} onRetry={reload} />
          : loading && !data ? <Skeleton className="h-40" />
          : !data || data.length === 0 ? <EmptyState icon="package" title="No orders yet" text="Orders containing your products will appear here." />
          : <div className="overflow-x-auto rounded-3xl border border-line bg-surface"><table className="w-full min-w-[560px] text-sm"><thead><tr className="border-b border-line text-left text-xs text-muted"><th className="p-4 font-medium">Order</th><th className="p-4 font-medium">Product</th><th className="p-4 font-medium">Qty</th><th className="p-4 font-medium">Amount</th><th className="p-4 font-medium">Status</th></tr></thead>
              <tbody className="divide-y divide-line">{data.map((l, i) => <tr key={`${l.orderId}-${l.productId}-${i}`}><td className="p-4">#{l.orderId}<span className="block text-xs text-muted">{formatDate(l.createdAt)}</span></td><td className="p-4">{l.productName}</td><td className="p-4">{l.quantity}</td><td className="p-4 font-medium">{money(l.subtotal)}</td><td className="p-4"><OrderStatusBadge status={l.orderStatus} /></td></tr>)}</tbody></table></div>}
      </div>
    </section>
  );
}
