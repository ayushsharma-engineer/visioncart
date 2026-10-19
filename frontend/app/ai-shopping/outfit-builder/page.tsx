"use client";

import { useState } from "react";
import Link from "next/link";
import type { Product } from "@/types/domain";
import type { AIOutfit, BudgetBreakdown, OutfitRole } from "@/types/ai";
import { ai, catalog } from "@/lib/services";
import { useAsync } from "@/lib/hooks/use-async";
import { useDebounced, useDocumentTitle } from "@/lib/hooks/misc";
import { useCart } from "@/lib/stores/cart";
import { describeError, isNotConnected } from "@/lib/core/errors";
import { findVariant, optionAxes } from "@/lib/core/variants";
import { cn } from "@/lib/core/utils";
import { money } from "@/lib/format";
import { BudgetBreakdownView, OutfitCard, ROLE_LABEL } from "@/components/ai/blocks";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { Sheet } from "@/components/ui/sheet";
import { SafeImage } from "@/components/ui/safe-image";
import { AsyncError, EmptyState, NotConnected } from "@/components/ui/states";
import { useToast } from "@/components/providers/toast";

interface BoardItem { uid: number; product: Product; role: OutfitRole; size: string | null; color: string | null }
const ROLES = Object.keys(ROLE_LABEL) as OutfitRole[];
const OCCASIONS = ["Casual", "Work", "Wedding", "Party", "Festival", "Travel", "Gym"];
const STYLES = ["Minimal", "Classic", "Boho", "Streetwear", "Sporty", "Ethnic"];
let uid = 1;

function guessRole(p: Product): OutfitRole {
  const n = `${p.category?.name ?? ""} ${p.name}`.toLowerCase();
  if (/shoe|sneaker|footwear|sandal|heel/.test(n)) return "footwear";
  if (/bag|backpack|tote|handbag/.test(n)) return "bag";
  if (/watch|sunglass|jewel|belt|accessor/.test(n)) return "accessory";
  if (/dress|gown/.test(n)) return "dress";
  if (/jacket|coat|blazer/.test(n)) return "outerwear";
  if (/serum|beauty|cream|lipstick/.test(n)) return "beauty";
  if (/jean|trouser|pant|skirt|short/.test(n)) return "bottom";
  return "top";
}

function Picker({ open, onClose, onPick }: { open: boolean; onClose: () => void; onPick: (p: Product) => void }) {
  const [q, setQ] = useState("");
  const term = useDebounced(q.trim(), 250);
  const { data, error, loading, reload } = useAsync(`picker:${open}:${term}`, (s) => open ? catalog.listProducts({ q: term || undefined, sort: "newest", pageSize: 12 }, { signal: s }) : Promise.resolve(null));
  return (
    <Sheet open={open} onClose={onClose} title="Add a piece">
      <label htmlFor="picker-q" className="sr-only">Search products</label>
      <div className="relative"><Icon name="search" size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" /><Input id="picker-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search the catalogue" className="pl-11" autoFocus /></div>
      <div className="mt-4">
        {error ? <AsyncError error={error} onRetry={reload} /> : loading && !data ? <p className="py-8 text-center text-sm text-muted">Searching…</p> : !data || data.items.length === 0 ? <p className="py-8 text-center text-sm text-muted">No products found.</p> : (
          <ul className="divide-y divide-line">{data.items.map((p) => (
            <li key={p.id} className="flex items-center gap-3 py-3"><SafeImage src={p.image_url} alt="" width={120} className="size-14 shrink-0 rounded-xl" />
              <div className="min-w-0 flex-1"><p className="line-clamp-1 text-sm font-medium">{p.name}</p><p className="text-xs text-muted">{p.category?.name} · {money(p.price)}</p></div>
              <Button size="sm" variant="outline" onClick={() => { onPick(p); onClose(); }}>Add</Button></li>))}</ul>)}
      </div>
    </Sheet>
  );
}

export default function OutfitBuilderPage() {
  useDocumentTitle("Outfit builder");
  const toast = useToast();
  const cart = useCart();
  const [budget, setBudget] = useState(10000);
  const [occasion, setOccasion] = useState("");
  const [style, setStyle] = useState("");
  const [gender, setGender] = useState("");
  const [board, setBoard] = useState<BoardItem[]>([]);
  const [picker, setPicker] = useState(false);
  const [suggest, setSuggest] = useState<{ status: "idle" | "loading" | "done" | "error"; outfits?: AIOutfit[]; breakdown?: BudgetBreakdown; error?: unknown }>({ status: "idle" });
  const [bagErrors, setBagErrors] = useState<string[]>([]);

  const spent = board.reduce((s, i) => s + i.product.price, 0);
  const over = spent > budget;
  const byRole = ROLES.map((r) => ({ role: r, amount: board.filter((i) => i.role === r).reduce((s, i) => s + i.product.price, 0) })).filter((a) => a.amount > 0);
  const breakdown: BudgetBreakdown = { budget, spent, remaining: Math.max(0, budget - spent), allocation: byRole };

  const addProduct = (p: Product) => setBoard((b) => b.some((i) => i.product.id === p.id) ? b : [...b, { uid: uid++, product: p, role: guessRole(p), size: null, color: null }]);
  const patch = (id: number, p: Partial<BoardItem>) => setBoard((b) => b.map((i) => (i.uid === id ? { ...i, ...p } : i)));

  const askAI = async () => {
    setSuggest({ status: "loading" });
    try {
      const res = await ai.suggestOutfits({ budgetMax: budget, occasion: occasion || undefined, style: style || undefined, gender: gender || undefined, anchorProductIds: board.map((i) => i.product.id) });
      setSuggest({ status: "done", outfits: res.outfits, breakdown: res.breakdown });
    } catch (e) { setSuggest({ status: "error", error: e }); }
  };

  const importOutfit = (o: AIOutfit) => { o.items.forEach((it) => setBoard((b) => b.some((x) => x.product.id === it.product.id) ? b : [...b, { uid: uid++, product: it.product, role: it.role, size: null, color: null }])); toast.success("Added to your look board"); };

  const addAllToBag = () => {
    const problems: string[] = [];
    const lines = board.map((i) => {
      const axes = optionAxes(i.product.variants);
      const size = i.size ?? (axes.sizes.length === 1 ? axes.sizes[0] : null);
      const color = i.color ?? (axes.colors.length === 1 ? axes.colors[0] : null);
      if (i.product.variants.length > 0) {
        if ((axes.sizes.length && !size) || (axes.colors.length && !color)) { problems.push(`${i.product.name}: choose ${axes.sizes.length && !size ? "a size" : "a colour"}`); return null; }
        const v = findVariant(i.product.variants, { size, color });
        if (!v || v.stock <= 0) { problems.push(`${i.product.name}: that combination is sold out`); return null; }
        return { productId: i.product.id, variantId: v.id, quantity: 1, name: i.product.name, price: i.product.price, image: v.image_url ?? i.product.image_url, size, color, brand: i.product.brand ?? null, maxQuantity: v.stock };
      }
      if (i.product.stock <= 0) { problems.push(`${i.product.name}: sold out`); return null; }
      return { productId: i.product.id, variantId: null, quantity: 1, name: i.product.name, price: i.product.price, image: i.product.image_url, size: null, color: null, brand: i.product.brand ?? null, maxQuantity: i.product.stock };
    });
    setBagErrors(problems);
    if (problems.length) return;
    lines.forEach((l) => l && cart.add(l));
    toast.success(`Added ${lines.length} ${lines.length === 1 ? "piece" : "pieces"} to your bag`);
  };

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-6 lg:px-8">
      <Breadcrumbs items={[{ label: "AI Stylist", href: "/ai-shopping" }, { label: "Outfit builder" }]} />
      <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Outfit builder</h1>
      <p className="mt-1 max-w-xl text-sm text-muted">Pick pieces, watch your budget, then add the whole look to your bag. Ask the AI stylist to suggest looks that fit.</p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-8">
          <section className="rounded-3xl border border-line bg-surface p-6" aria-labelledby="lb">
            <div className="flex flex-wrap items-center justify-between gap-3"><h2 id="lb" className="font-display text-xl font-semibold">Your look board</h2><Button variant="dark" size="sm" onClick={() => setPicker(true)}><Icon name="plus" size={15} />Add a piece</Button></div>
            {board.length === 0 ? <div className="mt-5"><EmptyState icon="layers" title="Start your look" text="Add a top, bottoms, shoes and finishing touches from the catalogue." /></div> : (
              <ul className="mt-5 divide-y divide-line">{board.map((i) => { const axes = optionAxes(i.product.variants); return (
                <li key={i.uid} className="flex flex-wrap items-center gap-4 py-4">
                  <Link href={`/product/${i.product.id}`}><SafeImage src={i.product.image_url} alt={i.product.name} width={160} className="size-20 rounded-2xl" /></Link>
                  <div className="min-w-0 flex-1 basis-48"><p className="line-clamp-1 text-sm font-medium">{i.product.name}</p><p className="text-sm text-muted">{money(i.product.price)}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Select aria-label="Role" value={i.role} onChange={(e) => patch(i.uid, { role: e.target.value as OutfitRole })} className="h-9 w-auto rounded-full py-0 text-xs">{ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}</Select>
                      {axes.sizes.length > 1 && <Select aria-label="Size" value={i.size ?? ""} onChange={(e) => patch(i.uid, { size: e.target.value || null })} className="h-9 w-auto rounded-full py-0 text-xs"><option value="">Size</option>{axes.sizes.map((s) => <option key={s}>{s}</option>)}</Select>}
                      {axes.colors.length > 1 && <Select aria-label="Colour" value={i.color ?? ""} onChange={(e) => patch(i.uid, { color: e.target.value || null })} className="h-9 w-auto rounded-full py-0 text-xs"><option value="">Colour</option>{axes.colors.map((c) => <option key={c}>{c}</option>)}</Select>}
                    </div></div>
                  <button type="button" aria-label={`Remove ${i.product.name}`} onClick={() => setBoard((b) => b.filter((x) => x.uid !== i.uid))} className="flex size-9 items-center justify-center rounded-full text-danger hover:bg-danger-soft"><Icon name="trash" size={16} /></button>
                </li>); })}</ul>)}
            {bagErrors.length > 0 && <ul role="alert" className="mt-4 space-y-1 rounded-xl bg-danger-soft p-4 text-sm text-danger">{bagErrors.map((e) => <li key={e}>{e}</li>)}</ul>}
            {board.length > 0 && <Button variant="primary" size="lg" className="mt-5" onClick={addAllToBag}><Icon name="bag" size={18} />Add look to bag · {money(spent)}</Button>}
          </section>

          <section aria-labelledby="ai-h" className="rounded-3xl border border-ai/20 bg-ai-soft/40 p-6">
            <h2 id="ai-h" className="flex items-center gap-2 font-display text-xl font-semibold"><Icon name="sparkles" size={18} className="text-ai" />Ask the AI stylist</h2>
            <p className="mt-1 text-sm text-muted">We&apos;ll send your budget and preferences{board.length ? " and build around the pieces on your board" : ""}.</p>
            <Button variant="ai" className="mt-4" loading={suggest.status === "loading"} onClick={askAI}><Icon name="sparkles" size={16} />Suggest outfits within {money(budget)}</Button>
            <div className="mt-5">
              {suggest.status === "error" && (isNotConnected(suggest.error) ? <NotConnected compact domain="The AI stylist" needs={(suggest.error as { needs: string[] }).needs} /> : <p role="alert" className="text-sm text-danger">{describeError(suggest.error)}</p>)}
              {suggest.status === "done" && (suggest.outfits?.length ? <div className="space-y-4">{suggest.outfits.map((o) => <OutfitCard key={o.id} outfit={o} onAdd={importOutfit} />)}</div> : <p className="text-sm text-muted">No outfits found for these settings. Try a higher budget.</p>)}
            </div>
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-32 lg:self-start" aria-label="Budget and preferences">
          <div className="rounded-3xl border border-line bg-surface p-5">
            <h2 className="font-display text-lg font-semibold">Your budget</h2>
            <p className="mt-3 font-display text-3xl font-semibold">{money(budget)}</p>
            <label htmlFor="budget-range" className="sr-only">Budget</label>
            <input id="budget-range" type="range" min={1000} max={50000} step={500} value={Math.min(Math.max(budget, 1000), 50000)} onChange={(e) => setBudget(Number(e.target.value))} className="mt-3 w-full accent-ai" />
            <div className="flex justify-between text-xs text-muted"><span>{money(1000)}</span><span>{money(50000)}</span></div>
            <Field label="Or enter an amount" className="mt-4">{(p) => <Input {...p} inputMode="numeric" value={budget} onChange={(e) => setBudget(Number(e.target.value.replace(/\D/g, "")) || 0)} className="h-11" />}</Field>
            <div className="mt-4 space-y-3">
              <Field label="Occasion" optional>{(p) => <Select {...p} value={occasion} onChange={(e) => setOccasion(e.target.value)} className="h-11"><option value="">Any</option>{OCCASIONS.map((o) => <option key={o}>{o}</option>)}</Select>}</Field>
              <Field label="Style" optional>{(p) => <Select {...p} value={style} onChange={(e) => setStyle(e.target.value)} className="h-11"><option value="">Any</option>{STYLES.map((o) => <option key={o}>{o}</option>)}</Select>}</Field>
              <Field label="Shopping for" optional>{(p) => <Select {...p} value={gender} onChange={(e) => setGender(e.target.value)} className="h-11"><option value="">Anyone</option><option>Women</option><option>Men</option><option>Kids</option></Select>}</Field>
            </div>
          </div>
          <BudgetBreakdownView breakdown={breakdown} />
          {over && <p role="alert" className={cn("rounded-2xl bg-danger-soft px-4 py-3 text-sm text-danger")}>Your look is {money(spent - budget)} over budget.</p>}
        </aside>
      </div>
      <Picker open={picker} onClose={() => setPicker(false)} onPick={addProduct} />
    </div>
  );
}
