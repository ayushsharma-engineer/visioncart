"use client";

import type { RecommendationRequest } from "@/types/ai";
import { ai } from "@/lib/services";
import { useAsync } from "@/lib/hooks/use-async";
import { isNotConnected } from "@/lib/core/errors";
import { config } from "@/lib/config";
import { Icon } from "../ui/icon";
import { SafeImage } from "../ui/safe-image";
import { Price } from "../ui/price";
import Link from "next/link";

/**
 * Where AI recommendations plug into a page. Calls the real AI service:
 *  - connected  -> renders the suggestions with the model's reasons
 *  - not connected -> renders NOTHING for shoppers (no fake "picks for you"); in dev builds
 *    shows a small dashed marker so developers can see the slot exists.
 */
export function AISlot({ request, title = "Picked for you" }: { request: RecommendationRequest; title?: string }) {
  const { data, error, loading } = useAsync(`ai-slot:${JSON.stringify(request)}`, (signal) => ai.recommend(request, { signal }));

  if (error) {
    if (isNotConnected(error) && config.isDev) {
      return (
        <div className="mx-auto my-8 max-w-[1440px] px-4 lg:px-8">
          <div className="flex items-center gap-2 rounded-2xl border border-dashed border-ai/40 bg-ai-soft/50 px-4 py-3 text-xs text-ai">
            <Icon name="sparkles" size={14} /> AI slot “{request.context}” — not connected, so nothing is shown to shoppers.
          </div>
        </div>
      );
    }
    return null;
  }
  if (loading || !data || data.length === 0) return null;

  return (
    <section className="mx-auto max-w-[1440px] px-4 py-10 lg:px-8" aria-label={title}>
      <h2 className="flex items-center gap-2 font-display text-2xl font-semibold"><Icon name="sparkles" className="text-ai" size={20} />{title}</h2>
      <ul className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-4">
        {data.map(({ product, reason }) => (
          <li key={product.id}>
            <Link href={`/product/${product.id}`} className="block">
              <SafeImage src={product.image_url} alt={product.name} width={480} className="aspect-[4/5] w-full rounded-2xl" />
              <p className="mt-2 line-clamp-1 text-sm font-medium">{product.name}</p>
              <Price price={product.price} compareAt={product.compare_at_price} size="sm" />
              <p className="mt-1 line-clamp-2 text-xs text-ai">{reason}</p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
