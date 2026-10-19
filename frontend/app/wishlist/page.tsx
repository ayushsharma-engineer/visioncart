"use client";

import Link from "next/link";
import { catalog } from "@/lib/services";
import { useAsync } from "@/lib/hooks/use-async";
import { useDocumentTitle } from "@/lib/hooks/misc";
import { useWishlist } from "@/lib/stores/wishlist";
import { pluralize } from "@/lib/core/utils";
import { money } from "@/lib/format";
import { ProductGrid } from "@/components/product/product-card";
import { SafeImage } from "@/components/ui/safe-image";
import { EmptyState } from "@/components/ui/states";
import { ProductGridSkeleton } from "@/components/ui/skeleton";
import { Icon } from "@/components/ui/icon";

export default function WishlistPage() {
  useDocumentTitle("Wishlist");
  const { entries, remove } = useWishlist();
  const ids = entries.map((e) => e.productId);
  const { data, error, loading } = useAsync(`wishlist:${ids.join(",")}`, (s) => ids.length ? catalog.getProductsByIds(ids, { signal: s }) : Promise.resolve([]));

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-8 lg:px-8">
      <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Your wishlist</h1>
      <p className="mt-1 text-sm text-muted">{pluralize(entries.length, "saved item")} · saved on this device</p>

      <div className="mt-8">
        {entries.length === 0 ? <EmptyState icon="heart" title="Nothing saved yet" text="Tap the heart on any product to keep it here for later." action={{ label: "Start browsing", href: "/shop" }} />
          : loading && !data ? <ProductGridSkeleton count={Math.min(entries.length, 8)} />
          : !error && data ? <ProductGrid products={data} />
          : (
            // Catalog unreachable: show what we saved at the time, clearly marked.
            <>
              <p className="mb-4 rounded-xl bg-warn-soft px-4 py-3 text-sm text-warn">Live prices and stock can&apos;t be loaded right now. Showing what you saved.</p>
              <ul className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {entries.map((e) => (
                  <li key={e.productId}>
                    <Link href={`/product/${e.productId}`}><SafeImage src={e.image} alt={e.name} width={480} className="aspect-[4/5] w-full rounded-2xl" /></Link>
                    <p className="mt-2 text-sm font-medium">{e.name}</p><p className="text-sm text-muted">{money(e.price)} when saved</p>
                    <button type="button" onClick={() => remove(e.productId)} className="mt-1 flex items-center gap-1 text-xs text-danger"><Icon name="trash" size={13} />Remove</button>
                  </li>
                ))}
              </ul>
            </>
          )}
      </div>
    </div>
  );
}
