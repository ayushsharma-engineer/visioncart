"use client";

import { Suspense, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ProductQuery, ProductSort } from "@/types/domain";
import { catalog } from "@/lib/services";
import { config } from "@/lib/config";
import { useAsync } from "@/lib/hooks/use-async";
import { useDocumentTitle } from "@/lib/hooks/misc";
import { activeFilterCount, parseProductQuery, serializeProductQuery } from "@/lib/core/url-state";
import { pluralize } from "@/lib/core/utils";
import { money } from "@/lib/format";
import { FilterPanel } from "@/components/product/filters";
import { ProductGrid } from "@/components/product/product-card";
import { ProductGridSkeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Sheet } from "@/components/ui/sheet";
import { AsyncError, EmptyState } from "@/components/ui/states";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";

const SORT_LABELS: Record<ProductSort, string> = {
  relevance: "Relevance",
  newest: "Newest first",
  price_asc: "Price: low to high",
  price_desc: "Price: high to low",
  rating: "Customer rating",
  discount: "Biggest discount",
};

function ShopInner() {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [filtersOpen, setFiltersOpen] = useState(false);

  const query = useMemo<ProductQuery>(() => ({ ...parseProductQuery(sp), pageSize: config.pageSize }), [sp]);
  const key = serializeProductQuery(query);

  const cats = useAsync("shop:categories", (s) => catalog.listCategories({ signal: s }).catch(() => []));
  const { data, error, loading, reload } = useAsync(`shop:${key}`, (signal) => catalog.listProducts(query, { signal }));

  const update = (patch: Partial<ProductQuery>) => {
    const next: ProductQuery = { ...query, ...patch };
    if (!("page" in patch)) next.page = undefined; // any filter change returns to page 1
    const qs = serializeProductQuery(next);
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };
  const clearAll = () => router.replace(query.q ? `${pathname}?q=${encodeURIComponent(query.q)}` : pathname, { scroll: false });

  const categories = cats.data ?? [];
  const category = categories.find((c) => c.id === query.categoryId);
  const title = query.q ? `Results for “${query.q}”` : category ? category.name : query.onSaleOnly ? "Deals" : "All products";
  useDocumentTitle(title);

  const filterCount = activeFilterCount(query);
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  const chips: { label: string; remove: () => void }[] = [];
  if (category) chips.push({ label: category.name, remove: () => update({ categoryId: undefined }) });
  if (query.minPrice !== undefined || query.maxPrice !== undefined)
    chips.push({ label: `${query.minPrice !== undefined ? money(query.minPrice) : "Any"} – ${query.maxPrice !== undefined ? money(query.maxPrice) : "Any"}`, remove: () => update({ minPrice: undefined, maxPrice: undefined }) });
  query.sizes?.forEach((s) => chips.push({ label: `Size ${s}`, remove: () => update({ sizes: query.sizes!.filter((x) => x !== s) }) }));
  query.colors?.forEach((c) => chips.push({ label: c, remove: () => update({ colors: query.colors!.filter((x) => x !== c) }) }));
  query.brands?.forEach((b) => chips.push({ label: b, remove: () => update({ brands: query.brands!.filter((x) => x !== b) }) }));
  if (query.minRating) chips.push({ label: `${query.minRating}★ & up`, remove: () => update({ minRating: undefined }) });
  if (query.inStockOnly) chips.push({ label: "In stock", remove: () => update({ inStockOnly: undefined }) });
  if (query.onSaleOnly) chips.push({ label: "On sale", remove: () => update({ onSaleOnly: undefined }) });

  const panel = <FilterPanel key={`${query.minPrice}-${query.maxPrice}`} query={query} facets={data?.facets} categories={categories} onChange={update} />;

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-6 lg:px-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Shop", href: category || query.q ? "/shop" : undefined }, ...(category ? [{ label: category.name }] : query.q ? [{ label: "Search" }] : [])]} />

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
          <p className="mt-1 text-sm text-muted" aria-live="polite">{data && !error ? pluralize(data.total, "product") : "\u00A0"}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="lg:hidden" onClick={() => setFiltersOpen(true)}>
            <Icon name="sliders" size={16} />Filters{filterCount > 0 && <span className="ml-1 rounded-full bg-ink px-1.5 text-[11px] text-white">{filterCount}</span>}
          </Button>
          <label className="flex items-center gap-2 text-sm"><span className="hidden text-muted sm:inline">Sort by</span>
            <Select aria-label="Sort products" value={query.sort ?? "relevance"} onChange={(e) => update({ sort: e.target.value as ProductSort })} className="h-10 w-auto min-w-44 rounded-full py-0 text-sm">
              {(Object.keys(SORT_LABELS) as ProductSort[]).map((s) => <option key={s} value={s}>{SORT_LABELS[s]}</option>)}
            </Select>
          </label>
        </div>
      </div>

      {chips.length > 0 && (
        <div className="mt-5 flex flex-wrap items-center gap-2" aria-label="Active filters">
          {chips.map((c) => (
            <button key={c.label} type="button" onClick={c.remove} className="flex items-center gap-1.5 rounded-full bg-sunken px-3 py-1.5 text-xs font-medium hover:bg-line">
              {c.label}<Icon name="close" size={12} /><span className="sr-only">Remove filter</span>
            </button>
          ))}
          <button type="button" onClick={clearAll} className="px-2 text-xs font-semibold text-brand underline">Clear all</button>
        </div>
      )}

      <div className="mt-8 grid gap-10 lg:grid-cols-[260px_1fr]">
        <aside className="hidden lg:block" aria-label="Filters"><div className="sticky top-32 max-h-[calc(100dvh-9rem)] overflow-y-auto pr-3">{panel}</div></aside>

        <div className={loading && data ? "opacity-60 transition-opacity" : "transition-opacity"}>
          {error ? <AsyncError error={error} onRetry={reload} />
            : !data ? <ProductGridSkeleton count={8} />
            : data.items.length === 0 ? (
              <EmptyState icon="search" title="No products match" text={query.q ? `We couldn't find anything for “${query.q}” with these filters. Try fewer filters or a different search.` : "Try removing a filter or two."} />
            ) : (
              <>
                <ProductGrid products={data.items} />
                <Pagination page={data.page} totalPages={totalPages} onChange={(p) => { update({ page: p }); window.scrollTo({ top: 0, behavior: "smooth" }); }} />
              </>
            )}
        </div>
      </div>

      <Sheet open={filtersOpen} onClose={() => setFiltersOpen(false)} title="Filters" side="bottom"
        footer={<div className="flex gap-3"><Button variant="outline" full onClick={clearAll}>Clear all</Button><Button variant="dark" full onClick={() => setFiltersOpen(false)}>Show {data ? pluralize(data.total, "product") : "results"}</Button></div>}>
        {panel}
      </Sheet>
    </div>
  );
}

export default function ShopPage() {
  // useSearchParams requires a Suspense boundary (Next.js prerenders this route).
  return <Suspense fallback={<div className="mx-auto max-w-[1440px] px-4 py-10 lg:px-8"><ProductGridSkeleton count={8} /></div>}><ShopInner /></Suspense>;
}
