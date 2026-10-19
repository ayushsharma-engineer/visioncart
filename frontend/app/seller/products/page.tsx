"use client";

import Link from "next/link";
import { seller } from "@/lib/services";
import { useAsync } from "@/lib/hooks/use-async";
import { useDocumentTitle } from "@/lib/hooks/misc";
import { describeError } from "@/lib/core/errors";
import { productStock } from "@/lib/core/variants";
import { money } from "@/lib/format";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SafeImage } from "@/components/ui/safe-image";
import { AsyncError, EmptyState } from "@/components/ui/states";
import { Skeleton } from "@/components/ui/skeleton";
import { Icon } from "@/components/ui/icon";
import { useToast } from "@/components/providers/toast";

export default function SellerProducts() {
  useDocumentTitle("Products");
  const toast = useToast();
  const { data, error, loading, reload } = useAsync("seller:products", (s) => seller.listProducts({ signal: s }));

  const remove = async (id: number, name: string) => {
    if (!window.confirm(`Delete “${name}”? This can't be undone.`)) return;
    try { await seller.deleteProduct(id); toast.success("Product deleted"); reload(); } catch (e) { toast.error(describeError(e)); }
  };

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-display text-2xl font-semibold">Your products</h2>
        <ButtonLink href="/seller/products/new" variant="primary" size="sm"><Icon name="plus" size={15} />Add product</ButtonLink></div>
      <div className="mt-6">
        {error ? <AsyncError error={error} onRetry={reload} />
          : loading && !data ? <div className="space-y-3"><Skeleton className="h-20" /><Skeleton className="h-20" /></div>
          : !data || data.length === 0 ? <EmptyState icon="tag" title="No products yet" text="Add your first product to start selling." action={{ label: "Add a product", href: "/seller/products/new" }} />
          : (
            <ul className="divide-y divide-line rounded-3xl border border-line bg-surface">
              {data.map((p) => { const stock = productStock(p); return (
                <li key={p.id} className="flex items-center gap-4 p-4">
                  <SafeImage src={p.image_url} alt="" width={160} className="size-16 shrink-0 rounded-xl" />
                  <div className="min-w-0 flex-1"><p className="truncate font-medium">{p.name}</p><p className="text-xs text-muted">{p.category?.name ?? `Category #${p.category_id}`} · {p.variants.length} variant{p.variants.length === 1 ? "" : "s"}</p></div>
                  <div className="hidden text-right text-sm sm:block"><p className="font-semibold">{money(p.price)}</p><p className={stock <= 0 ? "text-danger" : stock <= 5 ? "text-warn" : "text-muted"}>{stock <= 0 ? "Sold out" : `${stock} in stock`}</p></div>
                  <Badge tone={p.status === "active" ? "success" : "neutral"}>{p.status}</Badge>
                  <div className="flex gap-1"><Link href={`/seller/products/${p.id}`} aria-label={`Edit ${p.name}`} className="flex size-9 items-center justify-center rounded-full hover:bg-sunken"><Icon name="edit" size={16} /></Link>
                    <button type="button" aria-label={`Delete ${p.name}`} onClick={() => remove(p.id, p.name)} className="flex size-9 items-center justify-center rounded-full text-danger hover:bg-danger-soft"><Icon name="trash" size={16} /></button></div>
                </li>); })}
            </ul>
          )}
      </div>
    </section>
  );
}
