"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import type { CartLine } from "@/types/domain";
import { catalog } from "@/lib/services";
import { config } from "@/lib/config";
import { useAsync } from "@/lib/hooks/use-async";
import { useDocumentTitle } from "@/lib/hooks/misc";
import { useCart } from "@/lib/stores/cart";
import { findVariant, galleryImages, isOptionAvailable, optionAxes, productStock } from "@/lib/core/variants";
import { colorToCss, isLightColor } from "@/lib/core/colors";
import { cn, pluralize } from "@/lib/core/utils";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { SafeImage } from "@/components/ui/safe-image";
import { Price } from "@/components/ui/price";
import { Stars } from "@/components/ui/rating";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QuantityStepper } from "@/components/ui/quantity";
import { Skeleton } from "@/components/ui/skeleton";
import { AsyncError } from "@/components/ui/states";
import { WishlistButton } from "@/components/product/wishlist-button";
import { ProductGrid } from "@/components/product/product-card";
import { Reviews } from "@/components/product/reviews";
import { AISlot } from "@/components/ai/ai-slot";
import { useToast } from "@/components/providers/toast";
import type { Product } from "@/types/domain";
import { ApiError } from "@/lib/core/errors";

function Gallery({ product, color }: { product: Product; color: string | null }) {
  const images = galleryImages(product, color);
  const [picked, setPicked] = useState<string | null>(null);
  const current = picked && images.includes(picked) ? picked : images[0];
  return (
    <div className={cn("grid gap-3", images.length > 1 && "md:grid-cols-[84px_1fr]")}>
      {images.length > 1 && (
        <div className="order-2 flex gap-3 overflow-x-auto md:order-1 md:flex-col" role="list" aria-label="Product images">
          {images.map((u, i) => (
            <button key={u} role="listitem" type="button" onClick={() => setPicked(u)} aria-label={`Show image ${i + 1}`} aria-current={u === current}
              className={cn("size-20 shrink-0 overflow-hidden rounded-xl border-2", u === current ? "border-ink" : "border-transparent")}>
              <SafeImage src={u} alt="" width={160} className="size-full" />
            </button>
          ))}
        </div>
      )}
      <div className="order-1 overflow-hidden rounded-3xl bg-sunken md:order-2">
        <SafeImage src={current} alt={product.name} width={1100} eager className="aspect-[4/5] w-full" />
      </div>
    </div>
  );
}

function ProductView({ product }: { product: Product }) {
  const router = useRouter();
  const toast = useToast();
  const cart = useCart();
  const axes = optionAxes(product.variants);
  const [size, setSize] = useState<string | null>(null);
  const [color, setColor] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [attempted, setAttempted] = useState(false);

  // A single option (e.g. "One Size") is selected for the shopper.
  const effSize = size ?? (axes.sizes.length === 1 ? axes.sizes[0] : null);
  const effColor = color ?? (axes.colors.length === 1 ? axes.colors[0] : null);
  const hasVariants = product.variants.length > 0;
  const missing = hasVariants && ((axes.sizes.length > 0 && !effSize) ? "size" : (axes.colors.length > 0 && !effColor) ? "colour" : null);
  const variant = hasVariants && !missing ? findVariant(product.variants, { size: effSize, color: effColor }) : undefined;
  const stock = hasVariants ? (variant?.stock ?? 0) : product.stock;
  const totalStock = productStock(product);
  const canBuy = !missing && stock > 0 && (!hasVariants || !!variant);
  const qtyClamped = Math.min(qty, Math.max(1, Math.min(stock || 1, config.maxQuantityPerLine)));

  const toLine = (): CartLine => ({
    productId: product.id, variantId: variant?.id ?? null, quantity: qtyClamped, name: product.name, price: product.price,
    image: variant?.image_url ?? product.image_url, size: effSize, color: effColor, brand: product.brand ?? null, maxQuantity: stock,
  });

  const add = (then?: "checkout") => {
    setAttempted(true);
    if (!canBuy) return;
    cart.add(toLine());
    if (then === "checkout") router.push("/checkout");
    else toast.success(`Added ${product.name} to your bag`);
  };

  const sizeLabel = axes.sizes.length === 1 && axes.sizes[0].toLowerCase() === "one size" ? "Size" : "Select size";

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-6 lg:px-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Shop", href: "/shop" }, ...(product.category ? [{ label: product.category.name, href: `/shop?category=${product.category_id}` }] : []), { label: product.name }]} />

      <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-14">
        <Gallery product={product} color={effColor} />

        <div className="lg:sticky lg:top-32 lg:self-start">
          {product.brand && <p className="text-sm font-semibold uppercase tracking-wider text-muted">{product.brand}</p>}
          <h1 className="mt-1 font-display text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">{product.name}</h1>
          {product.seller_name && <p className="mt-1 text-sm text-muted">Sold by {product.seller_name}</p>}

          {product.rating_average ? (
            <a href="#reviews" className="mt-3 inline-flex items-center gap-2 text-sm hover:underline">
              <Stars value={product.rating_average} size={16} /><span className="font-semibold">{product.rating_average.toFixed(1)}</span>
              {product.review_count ? <span className="text-muted">({pluralize(product.review_count, "rating")})</span> : null}
            </a>
          ) : null}

          <Price price={product.price} compareAt={product.compare_at_price} size="lg" className="mt-4" />
          <p className="mt-1 text-xs text-muted">Inclusive of all taxes</p>

          {axes.colors.length > 0 && (
            <div className="mt-7">
              <p className="text-sm font-semibold">Colour{effColor && <span className="ml-2 font-normal text-muted">{effColor}</span>}</p>
              <div className="mt-3 flex flex-wrap gap-3" role="radiogroup" aria-label="Colour">
                {axes.colors.map((c) => {
                  const avail = isOptionAvailable(product.variants, "color", c, { size: effSize });
                  const on = effColor === c;
                  return (
                    <button key={c} type="button" role="radio" aria-checked={on} aria-label={`${c}${avail ? "" : " (sold out)"}`} title={c} onClick={() => setColor(c)}
                      className={cn("relative flex size-11 items-center justify-center rounded-full border-2 transition", on ? "border-ink" : "border-transparent hover:border-line-strong", !avail && "opacity-40")}>
                      <span className="size-8 rounded-full border border-black/10" style={{ background: colorToCss(c) }} />
                      {on && <Icon name="check" size={16} className={cn("absolute", isLightColor(c) ? "text-ink" : "text-white")} />}
                      {!avail && <span className="absolute h-px w-9 rotate-45 bg-ink/60" aria-hidden="true" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {axes.sizes.length > 0 && (
            <div className="mt-6">
              <p className="text-sm font-semibold">{sizeLabel}{attempted && missing === "size" && <span role="alert" className="ml-3 text-xs font-medium text-danger">Please choose a size</span>}</p>
              <div className="mt-3 flex flex-wrap gap-2.5" role="radiogroup" aria-label="Size">
                {axes.sizes.map((s) => {
                  const avail = isOptionAvailable(product.variants, "size", s, { color: effColor });
                  const on = effSize === s;
                  return (
                    <button key={s} type="button" role="radio" aria-checked={on} aria-label={`${s}${avail ? "" : " (sold out)"}`} onClick={() => setSize(s)}
                      className={cn("relative h-11 min-w-12 rounded-full border px-4 text-sm font-medium transition", on ? "border-ink bg-ink text-white" : "border-line-strong hover:border-ink", !avail && !on && "text-faint line-through decoration-faint")}>{s}</button>
                  );
                })}
              </div>
              {attempted && missing === "colour" && <p role="alert" className="mt-3 text-xs font-medium text-danger">Please choose a colour</p>}
            </div>
          )}

          <div className="mt-6 min-h-6 text-sm" aria-live="polite">
            {totalStock <= 0 ? <Badge tone="danger">Sold out</Badge>
              : !missing && stock <= 0 ? <Badge tone="danger">This combination is sold out</Badge>
              : !missing && stock <= 5 ? <Badge tone="warn">Only {stock} left</Badge>
              : <Badge tone="success">In stock</Badge>}
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <QuantityStepper value={qtyClamped} onChange={setQty} max={Math.max(1, Math.min(stock || 1, config.maxQuantityPerLine))} />
            <Button variant="primary" size="lg" className="min-w-44 flex-1" disabled={totalStock <= 0} onClick={() => add()}><Icon name="bag" size={18} />Add to bag</Button>
            <WishlistButton product={product} size={20} className="size-12 border border-line-strong !bg-surface" />
          </div>
          <Button variant="dark" size="lg" full className="mt-3" disabled={totalStock <= 0} onClick={() => add("checkout")}>Buy now</Button>

          <ul className="mt-8 space-y-3 rounded-2xl bg-sunken p-5 text-sm">
            <li className="flex items-center gap-3"><Icon name="truck" size={18} className="text-muted" />Free delivery on orders above ₹{config.freeShippingThreshold}</li>
            <li className="flex items-center gap-3"><Icon name="returns" size={18} className="text-muted" />{config.returnDays}-day easy returns</li>
            <li className="flex items-center gap-3"><Icon name="shield" size={18} className="text-muted" />Secure, encrypted checkout</li>
          </ul>
        </div>
      </div>

      <div className="mt-16 grid gap-10 lg:grid-cols-2">
        <section aria-labelledby="desc-h">
          <h2 id="desc-h" className="font-display text-2xl font-semibold">About this product</h2>
          <p className="mt-4 whitespace-pre-line leading-7 text-ink-soft">{product.description ?? "No description provided."}</p>
        </section>
        {product.attributes && Object.values(product.attributes).some((v) => (Array.isArray(v) ? v.length : v)) && (
          <section aria-labelledby="details-h">
            <h2 id="details-h" className="font-display text-2xl font-semibold">Details</h2>
            <dl className="mt-4 divide-y divide-line text-sm">
              {([["Material", product.attributes.material], ["Composition", product.attributes.composition], ["Fit", product.attributes.fit], ["Care", product.attributes.care_instructions], ["Occasions", product.attributes.occasions], ["Style", product.attributes.styles], ["Seasons", product.attributes.suitable_seasons]] as const)
                .filter(([, v]) => (Array.isArray(v) ? v.length : v && v !== "—"))
                .map(([k, v]) => (<div key={k} className="grid grid-cols-[130px_1fr] gap-4 py-3"><dt className="text-muted">{k}</dt><dd>{Array.isArray(v) ? v.join(", ") : v}</dd></div>))}
            </dl>
          </section>
        )}
      </div>

      <div className="mt-16"><Reviews productId={product.id} fallbackAverage={product.rating_average} fallbackCount={product.review_count} /></div>

      <AISlot request={{ context: "product", productId: product.id, limit: 4 }} title="Complete the look" />
      <MoreInCategory product={product} />
    </div>
  );
}

function MoreInCategory({ product }: { product: Product }) {
  const { data } = useAsync(`more:${product.category_id}:${product.id}`, (s) => catalog.listProducts({ categoryId: product.category_id, pageSize: 5 }, { signal: s }).catch(() => null));
  const items = (data?.items ?? []).filter((p) => p.id !== product.id).slice(0, 4);
  if (items.length === 0) return null;
  return (
    <section className="mt-16" aria-labelledby="more-h">
      <div className="mb-6 flex items-end justify-between"><h2 id="more-h" className="font-display text-2xl font-semibold">More in {product.category?.name ?? "this category"}</h2>
        <Link href={`/shop?category=${product.category_id}`} className="text-sm font-semibold hover:text-brand">View all</Link></div>
      <ProductGrid products={items} className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4" />
    </section>
  );
}

export default function ProductPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const valid = Number.isInteger(id) && id > 0;
  const { data, error, loading, reload } = useAsync(`product:${params.id}`, (s) => valid ? catalog.getProduct(id, { signal: s }) : Promise.reject(new ApiError(404, "PRODUCT_NOT_FOUND", "We couldn't find that product.")));
  useDocumentTitle(data?.name);

  if (!valid) return <div className="mx-auto max-w-3xl px-4 py-16"><AsyncError error={new ApiError(404, "PRODUCT_NOT_FOUND", "We couldn't find that product.")} /></div>;
  if (error) return <div className="mx-auto max-w-3xl px-4 py-16"><AsyncError error={error} onRetry={reload} /></div>;
  if (loading && !data) return (
    <div className="mx-auto grid max-w-[1440px] gap-10 px-4 py-10 lg:grid-cols-2 lg:px-8"><Skeleton className="aspect-[4/5] rounded-3xl" /><div className="space-y-4"><Skeleton className="h-4 w-1/4" /><Skeleton className="h-10 w-3/4" /><Skeleton className="h-8 w-1/3" /><Skeleton className="h-40" /></div></div>
  );
  return data ? <ProductView key={data.id} product={data} /> : null;
}
