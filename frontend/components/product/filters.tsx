"use client";

import { useState } from "react";
import type { Category, Facets, ProductQuery } from "@/types/domain";
import { colorToCss, isLightColor } from "@/lib/core/colors";
import { cn } from "@/lib/core/utils";
import { money } from "@/lib/format";
import { Checkbox } from "../ui/field";
import { Icon } from "../ui/icon";

function Group({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="border-b border-line py-5 first:pt-0">
      <button type="button" aria-expanded={open} onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between text-left text-sm font-semibold">
        {title}<Icon name={open ? "chevron-up" : "chevron-down"} size={16} className="text-muted" />
      </button>
      {open && <div className="mt-3">{children}</div>}
    </section>
  );
}

const toggle = (list: string[] | undefined, v: string) => {
  const cur = list ?? [];
  const next = cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v];
  return next.length ? next : undefined;
};

const PRICE_PRESETS: { label: string; min?: number; max?: number }[] = [
  { label: "Under ₹1,000", max: 1000 },
  { label: "₹1,000 – ₹2,500", min: 1000, max: 2500 },
  { label: "₹2,500 – ₹5,000", min: 2500, max: 5000 },
  { label: "Above ₹5,000", min: 5000 },
];

export function FilterPanel({ query, facets, categories, onChange }: { query: ProductQuery; facets?: Facets; categories: Category[]; onChange: (patch: Partial<ProductQuery>) => void }) {
  const [min, setMin] = useState(query.minPrice?.toString() ?? "");
  const [max, setMax] = useState(query.maxPrice?.toString() ?? "");
  const applyPrice = () => {
    const lo = min === "" ? undefined : Math.max(0, Number(min));
    const hi = max === "" ? undefined : Math.max(0, Number(max));
    if ((lo !== undefined && Number.isNaN(lo)) || (hi !== undefined && Number.isNaN(hi))) return;
    onChange(lo !== undefined && hi !== undefined && lo > hi ? { minPrice: hi, maxPrice: lo } : { minPrice: lo, maxPrice: hi });
  };
  const chip = (on: boolean) => cn("rounded-full border px-3.5 py-1.5 text-sm transition", on ? "border-ink bg-ink text-white" : "border-line-strong hover:border-ink");

  return (
    <div>
      {categories.length > 0 && (
        <Group title="Category">
          <ul className="space-y-1">
            <li><button type="button" onClick={() => onChange({ categoryId: undefined })} className={cn("w-full rounded-lg px-2 py-1.5 text-left text-sm hover:bg-sunken", query.categoryId === undefined && "font-semibold text-brand")}>All categories</button></li>
            {categories.map((c) => (
              <li key={c.id}><button type="button" aria-pressed={query.categoryId === c.id} onClick={() => onChange({ categoryId: c.id })} className={cn("w-full rounded-lg px-2 py-1.5 text-left text-sm hover:bg-sunken", query.categoryId === c.id && "font-semibold text-brand")}>{c.name}</button></li>
            ))}
          </ul>
        </Group>
      )}

      <Group title="Price">
        <div className="flex items-center gap-2">
          <input aria-label="Minimum price" inputMode="numeric" placeholder={facets ? String(facets.priceRange.min) : "Min"} value={min} onChange={(e) => setMin(e.target.value.replace(/\D/g, ""))} onBlur={applyPrice} onKeyDown={(e) => e.key === "Enter" && applyPrice()} className="h-10 w-full rounded-xl border border-line-strong px-3 text-sm outline-none focus:border-ink" />
          <span className="text-muted">–</span>
          <input aria-label="Maximum price" inputMode="numeric" placeholder={facets ? String(facets.priceRange.max) : "Max"} value={max} onChange={(e) => setMax(e.target.value.replace(/\D/g, ""))} onBlur={applyPrice} onKeyDown={(e) => e.key === "Enter" && applyPrice()} className="h-10 w-full rounded-xl border border-line-strong px-3 text-sm outline-none focus:border-ink" />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {PRICE_PRESETS.map((p) => {
            const on = query.minPrice === p.min && query.maxPrice === p.max;
            return <button key={p.label} type="button" aria-pressed={on} className={chip(on).replace("px-3.5 py-1.5", "px-3 py-1 text-xs")}
              onClick={() => { setMin(p.min?.toString() ?? ""); setMax(p.max?.toString() ?? ""); onChange(on ? { minPrice: undefined, maxPrice: undefined } : { minPrice: p.min, maxPrice: p.max }); }}>{p.label}</button>;
          })}
        </div>
        {facets && <p className="mt-2 text-xs text-muted">Range in results: {money(facets.priceRange.min)} – {money(facets.priceRange.max)}</p>}
      </Group>

      {facets && facets.sizes.length > 0 && (
        <Group title="Size">
          <div className="flex flex-wrap gap-2">
            {facets.sizes.map((s) => { const on = !!query.sizes?.includes(s); return <button key={s} type="button" aria-pressed={on} className={chip(on)} onClick={() => onChange({ sizes: toggle(query.sizes, s) })}>{s}</button>; })}
          </div>
        </Group>
      )}

      {facets && facets.colors.length > 0 && (
        <Group title="Colour">
          <div className="flex flex-wrap gap-2.5">
            {facets.colors.map((c) => {
              const on = !!query.colors?.includes(c);
              return (
                <button key={c} type="button" aria-pressed={on} aria-label={c} title={c} onClick={() => onChange({ colors: toggle(query.colors, c) })}
                  className={cn("relative flex size-9 items-center justify-center rounded-full border-2 transition", on ? "border-ink" : "border-transparent hover:border-line-strong")}>
                  <span className="size-6 rounded-full border border-black/10" style={{ background: colorToCss(c) }} />
                  {on && <Icon name="check" size={14} className={cn("absolute", isLightColor(c) ? "text-ink" : "text-white")} />}
                </button>
              );
            })}
          </div>
        </Group>
      )}

      {facets && facets.brands.length > 0 && (
        <Group title="Brand" defaultOpen={false}>
          <ul className="max-h-56 space-y-2.5 overflow-y-auto pr-1">
            {facets.brands.map((b) => <li key={b}><Checkbox label={b} checked={!!query.brands?.includes(b)} onChange={() => onChange({ brands: toggle(query.brands, b) })} /></li>)}
          </ul>
        </Group>
      )}

      <Group title="Customer rating" defaultOpen={false}>
        <ul className="space-y-2.5">
          {[4, 3].map((r) => (
            <li key={r}><label className="flex cursor-pointer items-center gap-2.5 text-sm"><input type="radio" name="rating" className="accent-ink" checked={query.minRating === r} onChange={() => onChange({ minRating: r })} />{r}★ &amp; above</label></li>
          ))}
          {query.minRating && <li><button type="button" className="text-xs text-brand underline" onClick={() => onChange({ minRating: undefined })}>Clear rating</button></li>}
        </ul>
      </Group>

      <Group title="Availability">
        <div className="space-y-2.5">
          <Checkbox label="In stock only" checked={!!query.inStockOnly} onChange={(e) => onChange({ inStockOnly: e.target.checked || undefined })} />
          <Checkbox label="On sale" checked={!!query.onSaleOnly} onChange={(e) => onChange({ onSaleOnly: e.target.checked || undefined })} />
        </div>
      </Group>
    </div>
  );
}
