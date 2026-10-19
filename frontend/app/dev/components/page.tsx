"use client";

import { notFound } from "next/navigation";
import { config } from "@/lib/config";
import { FIXTURE_PRODUCTS } from "@/lib/fixtures/catalog-data";
import type { AIBlock, AIOutfit } from "@/types/ai";
import { AIBlocks, OutfitCard } from "@/components/ai/blocks";
import { Badge } from "@/components/ui/badge";

/**
 * Component gallery for AI result renderers. There is NO AI behind this page: the data is
 * hand-assembled from fixture products purely so the renderers can be reviewed visually
 * before the AI backend exists. Never reachable in production builds.
 */
export default function ComponentGallery() {
  if (!config.isDev) notFound();
  const p = (id: number) => FIXTURE_PRODUCTS.find((x) => x.id === id)!;
  const outfit: AIOutfit = {
    id: "sample", title: "Sample look (hand-built)", occasion: "Casual weekend", description: "A placeholder outfit to review the card layout.", within_budget: true,
    items: [{ role: "top", product: p(7), reason: "Sample reason" }, { role: "outerwear", product: p(11) }, { role: "footwear", product: p(2) }, { role: "accessory", product: p(5) }],
    total_price: p(7).price + p(11).price + p(2).price + p(5).price,
  };
  const blocks: AIBlock[] = [
    { type: "text", text: "Sample assistant text block." },
    { type: "products", title: "Sample product suggestions", items: [{ product: p(1), reason: "Sample reason text" }, { product: p(8), reason: "Another sample reason" }] },
    { type: "budget", breakdown: { budget: 15000, spent: 12000, remaining: 3000, allocation: [{ role: "top", amount: 1299 }, { role: "outerwear", amount: 3299 }, { role: "footwear", amount: 3999 }, { role: "accessory", amount: 6299 }] } },
    { type: "followups", suggestions: ["Show cheaper options", "Make it more formal"] },
  ];
  return (
    <div className="mx-auto max-w-3xl space-y-10 px-4 py-10">
      <div><Badge tone="warn">Dev only — sample data, not AI output</Badge><h1 className="mt-3 font-display text-3xl font-semibold">AI component gallery</h1></div>
      <section><h2 className="mb-3 font-semibold">AIBlocks</h2><div className="rounded-3xl border border-line bg-surface p-5 text-sm"><AIBlocks blocks={blocks} /></div></section>
      <section><h2 className="mb-3 font-semibold">OutfitCard</h2><OutfitCard outfit={outfit} onAdd={() => {}} /></section>
    </div>
  );
}
