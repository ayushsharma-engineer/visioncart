"use client";

import Link from "next/link";
import type { AIBlock, AIOutfit, BudgetBreakdown, OutfitRole } from "@/types/ai";
import { money } from "@/lib/format";
import { cn } from "@/lib/core/utils";
import { SafeImage } from "../ui/safe-image";
import { Price } from "../ui/price";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Icon } from "../ui/icon";

export const ROLE_LABEL: Record<OutfitRole, string> = {
  top: "Top", bottom: "Bottom", dress: "Dress", outerwear: "Outerwear", footwear: "Footwear", bag: "Bag", accessory: "Accessory", beauty: "Beauty",
};

export function OutfitCard({ outfit, onAdd, addLabel = "Add to look board" }: { outfit: AIOutfit; onAdd?: (o: AIOutfit) => void; addLabel?: string }) {
  return (
    <article className="overflow-hidden rounded-3xl border border-line bg-surface">
      <div className="flex flex-wrap items-start justify-between gap-2 p-5 pb-3">
        <div><h3 className="font-display text-lg font-semibold">{outfit.title}</h3>{outfit.occasion && <p className="text-xs text-muted">{outfit.occasion}</p>}</div>
        <Badge tone={outfit.within_budget ? "success" : "warn"}>{outfit.within_budget ? "Within budget" : "Over budget"}</Badge>
      </div>
      {outfit.description && <p className="px-5 text-sm text-ink-soft">{outfit.description}</p>}
      <ul className="mt-4 grid grid-cols-2 gap-3 px-5 sm:grid-cols-4">
        {outfit.items.map((it) => (
          <li key={`${it.role}-${it.product.id}`}>
            <Link href={`/product/${it.product.id}`} className="block"><SafeImage src={it.product.image_url} alt={it.product.name} width={300} className="aspect-[4/5] w-full rounded-xl" />
              <p className="mt-1.5 text-[11px] font-semibold uppercase tracking-wide text-ai">{ROLE_LABEL[it.role]}</p>
              <p className="line-clamp-1 text-xs font-medium">{it.product.name}</p><p className="text-xs text-muted">{money(it.product.price)}</p></Link>
            {it.reason && <p className="mt-1 line-clamp-2 text-[11px] text-muted">{it.reason}</p>}
          </li>
        ))}
      </ul>
      <div className="mt-5 flex items-center justify-between border-t border-line bg-sunken/60 px-5 py-4">
        <p className="text-sm"><span className="text-muted">Total </span><strong>{money(outfit.total_price)}</strong></p>
        {onAdd && <Button size="sm" variant="ai" onClick={() => onAdd(outfit)}><Icon name="plus" size={14} />{addLabel}</Button>}
      </div>
    </article>
  );
}

export function BudgetBreakdownView({ breakdown }: { breakdown: BudgetBreakdown }) {
  const over = breakdown.spent > breakdown.budget;
  return (
    <section className="rounded-3xl border border-line bg-surface p-5" aria-label="Budget breakdown">
      <div className="flex items-end justify-between"><h3 className="font-display text-lg font-semibold">Budget</h3>
        <p className="text-sm"><strong>{money(breakdown.spent)}</strong> <span className="text-muted">of {money(breakdown.budget)}</span></p></div>
      <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuemin={0} aria-valuemax={breakdown.budget} aria-valuenow={Math.min(breakdown.spent, breakdown.budget)} aria-label="Budget used">
        <div className={cn("h-full rounded-full transition-all", over ? "bg-danger" : "bg-ai")} style={{ width: `${Math.min(100, breakdown.budget ? (breakdown.spent / breakdown.budget) * 100 : 0)}%` }} /></div>
      <p className={cn("mt-2 text-xs", over ? "font-semibold text-danger" : "text-muted")}>{over ? `${money(breakdown.spent - breakdown.budget)} over budget` : `${money(breakdown.remaining)} left`}</p>
      {breakdown.allocation.length > 0 && (
        <ul className="mt-4 space-y-2">{breakdown.allocation.map((a) => (
          <li key={a.role} className="text-xs"><div className="flex justify-between"><span>{ROLE_LABEL[a.role]}</span><span className="font-medium">{money(a.amount)}</span></div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-line"><div className="h-full rounded-full bg-ai/60" style={{ width: `${breakdown.spent ? (a.amount / breakdown.spent) * 100 : 0}%` }} /></div></li>))}</ul>)}
    </section>
  );
}

export function AIBlocks({ blocks, onFollowup }: { blocks: AIBlock[]; onFollowup?: (q: string) => void }) {
  return (
    <div className="space-y-4">
      {blocks.map((b, i) => {
        switch (b.type) {
          case "text": return <p key={i} className="whitespace-pre-line leading-7">{b.text}</p>;
          case "products": return (
            <div key={i}>{b.title && <p className="mb-2 text-sm font-semibold">{b.title}</p>}
              <ul className="grid gap-3 sm:grid-cols-2">{b.items.map(({ product, reason }) => (
                <li key={product.id}><Link href={`/product/${product.id}`} className="flex gap-3 rounded-2xl border border-line bg-surface p-3 transition hover:border-ai">
                  <SafeImage src={product.image_url} alt="" width={200} className="size-20 shrink-0 rounded-xl" />
                  <div className="min-w-0"><p className="line-clamp-1 text-sm font-medium">{product.name}</p><Price price={product.price} compareAt={product.compare_at_price} size="sm" /><p className="mt-1 line-clamp-2 text-xs text-ai">{reason}</p></div></Link></li>))}</ul></div>);
          case "outfits": return <div key={i} className="space-y-4">{b.title && <p className="text-sm font-semibold">{b.title}</p>}{b.outfits.map((o) => <OutfitCard key={o.id} outfit={o} />)}</div>;
          case "budget": return <BudgetBreakdownView key={i} breakdown={b.breakdown} />;
          case "followups": return (
            <div key={i} className="flex flex-wrap gap-2">{b.suggestions.map((s) => <button key={s} type="button" onClick={() => onFollowup?.(s)} className="rounded-full border border-ai/30 bg-ai-soft px-3.5 py-1.5 text-xs font-medium text-ai hover:bg-ai/15">{s}</button>)}</div>);
        }
      })}
    </div>
  );
}
