import Link from "next/link";
import type { Product } from "@/types/domain";
import { discountPercent } from "@/lib/core/money";
import { optionAxes, productStock } from "@/lib/core/variants";
import { colorToCss } from "@/lib/core/colors";
import { SafeImage } from "../ui/safe-image";
import { Price } from "../ui/price";
import { Stars } from "../ui/rating";
import { WishlistButton } from "./wishlist-button";

export function ProductCard({ product, priority }: { product: Product; priority?: boolean }) {
  const off = discountPercent(product.price, product.compare_at_price);
  const soldOut = productStock(product) <= 0;
  const colors = optionAxes(product.variants).colors;
  return (
    <article className="group relative">
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-sunken">
        <Link href={`/product/${product.id}`} aria-label={product.name} tabIndex={-1} className="block size-full">
          <SafeImage src={product.image_url} alt={product.name} width={640} eager={priority}
            className="size-full transition duration-500 group-hover:scale-105" />
        </Link>
        {off > 0 && !soldOut && <span className="absolute left-3 top-3 rounded-full bg-brand px-2.5 py-1 text-xs font-bold text-white">{off}% off</span>}
        {soldOut && <span className="absolute inset-x-0 bottom-0 bg-ink/80 py-2 text-center text-xs font-semibold text-white">Sold out</span>}
        <WishlistButton product={product} className="absolute right-3 top-3 z-10" />
      </div>
      <div className="mt-3">
        <p className="truncate text-xs font-medium uppercase tracking-wide text-muted">{product.brand ?? product.category?.name ?? " "}</p>
        <h3 className="mt-0.5 line-clamp-1 text-sm font-medium text-ink">
          <Link href={`/product/${product.id}`} className="after:absolute after:inset-0 after:content-['']">{product.name}</Link>
        </h3>
        <Price price={product.price} compareAt={product.compare_at_price} size="sm" className="mt-1" />
        <div className="mt-1.5 flex min-h-5 items-center gap-2">
          {product.rating_average ? <span className="flex items-center gap-1 text-xs text-muted"><Stars value={product.rating_average} size={12} />{product.review_count ? `(${product.review_count.toLocaleString("en-IN")})` : null}</span> : null}
          {colors.length > 1 && (
            <span className="ml-auto flex items-center gap-1" aria-label={`${colors.length} colours`}>
              {colors.slice(0, 4).map((c) => <span key={c} title={c} className="size-3 rounded-full border border-black/10" style={{ background: colorToCss(c) }} />)}
              {colors.length > 4 && <span className="text-[10px] text-muted">+{colors.length - 4}</span>}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

export function ProductGrid({ products, className }: { products: Product[]; className?: string }) {
  return (
    <div className={className ?? "grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 xl:grid-cols-4"}>
      {products.map((p, i) => <ProductCard key={p.id} product={p} priority={i < 4} />)}
    </div>
  );
}
