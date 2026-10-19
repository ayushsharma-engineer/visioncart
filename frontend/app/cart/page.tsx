"use client";

import Link from "next/link";
import { useCart } from "@/lib/stores/cart";
import { useWishlist } from "@/lib/stores/wishlist";
import { lineKey } from "@/lib/core/cart";
import { useDocumentTitle } from "@/lib/hooks/misc";
import { money } from "@/lib/format";
import { SafeImage } from "@/components/ui/safe-image";
import { QuantityStepper } from "@/components/ui/quantity";
import { ButtonLink } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { EmptyState } from "@/components/ui/states";
import { OrderSummary } from "@/components/cart/order-summary";
import { AISlot } from "@/components/ai/ai-slot";
import { useToast } from "@/components/providers/toast";
import { config } from "@/lib/config";

export default function CartPage() {
  useDocumentTitle("Shopping bag");
  const { lines, totals, setQuantity, remove } = useCart();
  const wishlist = useWishlist();
  const toast = useToast();

  if (lines.length === 0) {
    return <div className="mx-auto max-w-3xl px-4 py-16"><EmptyState icon="bag" title="Your bag is empty" text="Add something you love and it will wait for you here." action={{ label: "Continue shopping", href: "/shop" }} /></div>;
  }

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-8 lg:px-8">
      <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Shopping bag</h1>
      <p className="mt-1 text-sm text-muted">{totals.itemCount} {totals.itemCount === 1 ? "item" : "items"}</p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_400px]">
        <ul className="divide-y divide-line rounded-3xl border border-line bg-surface">
          {lines.map((l) => {
            const key = lineKey(l);
            return (
              <li key={key} className="flex gap-4 p-4 sm:gap-6 sm:p-6">
                <Link href={`/product/${l.productId}`} className="shrink-0"><SafeImage src={l.image} alt={l.name} width={240} className="size-28 rounded-2xl sm:size-36" /></Link>
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex justify-between gap-3">
                    <div className="min-w-0">
                      {l.brand && <p className="text-xs font-medium uppercase tracking-wide text-muted">{l.brand}</p>}
                      <Link href={`/product/${l.productId}`} className="line-clamp-2 font-medium hover:underline">{l.name}</Link>
                      <p className="mt-1 text-sm text-muted">{[l.color, l.size && `Size ${l.size}`].filter(Boolean).join(" · ") || "Standard"}</p>
                    </div>
                    <p className="shrink-0 font-semibold">{money(l.price * l.quantity)}</p>
                  </div>
                  <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-4">
                    <QuantityStepper value={l.quantity} onChange={(n) => setQuantity(key, n)} max={l.maxQuantity > 0 ? Math.min(l.maxQuantity, config.maxQuantityPerLine) : config.maxQuantityPerLine} label={`Quantity for ${l.name}`} />
                    <div className="flex gap-4 text-sm">
                      <button type="button" className="flex items-center gap-1.5 text-muted hover:text-ink" onClick={() => {
                        if (!wishlist.has(l.productId)) wishlist.toggle({ productId: l.productId, name: l.name, price: l.price, image: l.image, brand: l.brand });
                        remove(key); toast.info("Moved to wishlist");
                      }}><Icon name="heart" size={15} />Save for later</button>
                      <button type="button" className="flex items-center gap-1.5 text-danger" onClick={() => remove(key)} aria-label={`Remove ${l.name}`}><Icon name="trash" size={15} />Remove</button>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        <div className="lg:sticky lg:top-32 lg:self-start">
          <OrderSummary totals={totals}>
            <ButtonLink href="/checkout" variant="primary" size="lg" full>Proceed to checkout</ButtonLink>
            <Link href="/shop" className="mt-3 block text-center text-sm font-medium text-muted hover:text-ink">Continue shopping</Link>
          </OrderSummary>
          <p className="mt-3 px-2 text-xs text-muted">Prices in your bag are shown as they were when you added them. Final prices and stock are confirmed when you place the order.</p>
        </div>
      </div>
      <AISlot request={{ context: "cart", limit: 4 }} title="Goes well with your bag" />
    </div>
  );
}
