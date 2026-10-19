"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { orders } from "@/lib/services";
import { useAsync } from "@/lib/hooks/use-async";
import { useDocumentTitle } from "@/lib/hooks/misc";
import { describeError } from "@/lib/core/errors";
import { formatDate } from "@/lib/core/utils";
import { cn } from "@/lib/core/utils";
import { money } from "@/lib/format";
import { SafeImage } from "@/components/ui/safe-image";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/ui/status-badge";
import { AsyncError } from "@/components/ui/states";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/providers/toast";

const FLOW = ["pending", "confirmed", "shipped", "delivered"] as const;

function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const placed = useSearchParams().get("placed") === "1";
  const toast = useToast();
  const [cancelling, setCancelling] = useState(false);
  const orderId = Number(id);
  const { data: order, error, loading, reload } = useAsync(`order:${id}`, (s) => orders.get(orderId, { signal: s }));
  useDocumentTitle(order ? `Order #${order.id}` : "Order");

  if (error) return <AsyncError error={error} onRetry={reload} />;
  if (loading && !order) return <div className="space-y-4"><Skeleton className="h-24" /><Skeleton className="h-64" /></div>;
  if (!order) return null;

  const status = order.status.toLowerCase();
  const cancelled = status === "cancelled";
  const stepIdx = FLOW.indexOf(status as (typeof FLOW)[number]);
  const canCancel = status === "pending" || status === "confirmed";
  const itemsTotal = order.items.reduce((s, i) => s + i.subtotal, 0);

  const cancel = async () => {
    if (!window.confirm("Cancel this order?")) return;
    setCancelling(true);
    try { await orders.cancel(order.id); toast.success("Order cancelled"); reload(); } catch (e) { toast.error(describeError(e)); } finally { setCancelling(false); }
  };

  return (
    <div className="space-y-6">
      {placed && <div role="status" className="flex items-start gap-3 rounded-2xl bg-success-soft p-4 text-sm text-success"><Icon name="check-circle" size={20} className="mt-0.5 shrink-0" /><div><p className="font-semibold">Thank you — your order is in.</p><p>We&apos;ll keep this page updated as it moves.</p></div></div>}
      <Link href="/account/orders" className="inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-ink"><Icon name="arrow-left" size={15} />All orders</Link>

      <section className="rounded-3xl border border-line bg-surface p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div><h2 className="font-display text-2xl font-semibold">Order #{order.id}</h2><p className="text-sm text-muted">Placed {formatDate(order.created_at)}</p></div>
          <div className="flex gap-2"><OrderStatusBadge status={order.status} /><PaymentStatusBadge status={order.payment_status} /></div>
        </div>
        {!cancelled && stepIdx >= 0 && (
          <ol className="mt-6 grid grid-cols-4 gap-2" aria-label="Order progress">
            {FLOW.map((s, i) => (<li key={s} className="text-center"><div className={cn("h-1.5 rounded-full", i <= stepIdx ? "bg-ink" : "bg-line")} /><p className={cn("mt-2 text-xs capitalize", i <= stepIdx ? "font-semibold" : "text-muted")}>{s}</p></li>))}
          </ol>
        )}
      </section>

      <section className="rounded-3xl border border-line bg-surface" aria-label="Items">
        <ul className="divide-y divide-line">
          {order.items.map((it) => (
            <li key={it.id} className="flex items-center gap-4 p-5">
              <SafeImage src={it.product?.image_url} alt="" width={200} className="size-20 rounded-2xl" />
              <div className="min-w-0 flex-1 text-sm"><Link href={`/product/${it.product_id}`} className="line-clamp-2 font-medium hover:underline">{it.product?.name ?? `Product #${it.product_id}`}</Link>
                <p className="mt-0.5 text-muted">{[it.color, it.size && `Size ${it.size}`].filter(Boolean).join(" · ")}{(it.color || it.size) && " · "}Qty {it.quantity} × {money(it.unit_price)}</p></div>
              <p className="font-semibold">{money(it.subtotal)}</p>
            </li>
          ))}
        </ul>
        <dl className="space-y-2 border-t border-line p-5 text-sm">
          <div className="flex justify-between"><dt className="text-muted">Items</dt><dd>{money(itemsTotal)}</dd></div>
          {order.total_amount !== itemsTotal && <div className="flex justify-between"><dt className="text-muted">Delivery & adjustments</dt><dd>{money(order.total_amount - itemsTotal)}</dd></div>}
          <div className="flex justify-between border-t border-line pt-3 text-base font-semibold"><dt>Total</dt><dd>{money(order.total_amount)}</dd></div>
        </dl>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        {order.address && <section className="rounded-3xl border border-line bg-surface p-5 text-sm"><h3 className="font-semibold">Delivery address</h3><p className="mt-2 leading-6 text-ink-soft">{order.address.full_name}<br />{order.address.address_line}<br />{order.address.city}, {order.address.state} {order.address.postal_code}<br />{order.address.phone}</p></section>}
        {order.payment && <section className="rounded-3xl border border-line bg-surface p-5 text-sm"><h3 className="font-semibold">Payment</h3><p className="mt-2 text-ink-soft capitalize">{order.payment.payment_method}</p>{order.payment.transaction_id && <p className="mt-1 text-xs text-muted">Ref: {order.payment.transaction_id}</p>}</section>}
      </div>

      {canCancel && <Button variant="outline" onClick={cancel} loading={cancelling}>Cancel order</Button>}
    </div>
  );
}

export default function OrderPage() {
  return <Suspense fallback={<Skeleton className="h-64" />}><OrderDetail /></Suspense>;
}
