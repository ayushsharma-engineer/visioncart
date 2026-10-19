"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { catalog } from "@/lib/services";
import { useAsync } from "@/lib/hooks/use-async";
import { Icon } from "@/components/ui/icon";
import { SafeImage } from "@/components/ui/safe-image";
import { ButtonLink } from "@/components/ui/button";
import { ProductGrid } from "@/components/product/product-card";
import { ProductGridSkeleton, Skeleton } from "@/components/ui/skeleton";
import { AsyncError } from "@/components/ui/states";
import { AISlot } from "@/components/ai/ai-slot";

const HERO_IMAGE = "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=85";

const PROMPTS = [
  "Wedding outfit under ₹10,000",
  "Complete casual look for the weekend",
  "Best running shoes for daily use",
  "Summer office wear",
];

function SectionHead({ eyebrow, title, href, cta = "View all" }: { eyebrow?: string; title: string; href?: string; cta?: string }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand">{eyebrow}</p>}
        <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h2>
      </div>
      {href && <Link href={href} className="flex shrink-0 items-center gap-1 text-sm font-semibold hover:text-brand">{cta}<Icon name="arrow-right" size={16} /></Link>}
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const [q, setQ] = useState("");

  const cats = useAsync("home:categories", (s) => catalog.listCategories({ signal: s }));
  const fresh = useAsync("home:new", (s) => catalog.listProducts({ sort: "newest", pageSize: 8 }, { signal: s }));
  const deals = useAsync("home:deals", (s) => catalog.listProducts({ onSaleOnly: true, sort: "discount", pageSize: 4 }, { signal: s }));

  const catalogError = cats.error ?? fresh.error;

  return (
    <>
      {/* HERO */}
      <section className="px-4 pt-4 lg:px-8">
        <div className="relative mx-auto grid max-w-[1440px] overflow-hidden rounded-[2rem] bg-sunken lg:grid-cols-[1.1fr_1fr]">
          <div className="relative z-10 px-6 py-14 sm:px-12 lg:py-24 lg:pl-16">
            <p className="inline-flex items-center gap-2 rounded-full bg-ai-soft px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-ai"><Icon name="sparkles" size={14} />AI-powered fashion</p>
            <h1 className="mt-6 font-display text-5xl font-semibold leading-[1.02] tracking-tight sm:text-6xl xl:text-7xl">
              Dress for the moment.<span className="block text-brand">Within your budget.</span>
            </h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-ink-soft sm:text-lg">
              Browse fashion from independent sellers across India, or tell our AI stylist the occasion and your budget and let it build the look.
            </p>
            <form role="search" onSubmit={(e) => { e.preventDefault(); router.push(q.trim() ? `/shop?q=${encodeURIComponent(q.trim())}` : "/shop"); }} className="mt-8 flex max-w-xl flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <label htmlFor="hero-search" className="sr-only">Search products</label>
                <Icon name="search" size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                <input id="hero-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search kurtas, sneakers, handbags…" className="h-14 w-full rounded-full border border-line-strong bg-surface pl-12 pr-4 text-sm shadow-card outline-none focus:border-ink" />
              </div>
              <button type="submit" className="h-14 rounded-full bg-ink px-8 text-sm font-semibold text-white transition hover:bg-ink-soft">Search</button>
            </form>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted">Ask the AI stylist:</span>
              {PROMPTS.map((p) => (
                <Link key={p} href={`/ai-shopping?prompt=${encodeURIComponent(p)}`} className="rounded-full border border-line-strong bg-surface px-3 py-1.5 text-xs text-ink-soft transition hover:border-ai hover:text-ai">{p}</Link>
              ))}
            </div>
          </div>
          <div className="relative hidden min-h-[480px] lg:block">
            <SafeImage src={HERO_IMAGE} alt="" width={1200} eager className="absolute inset-0 size-full" />
            <div className="absolute inset-0 bg-gradient-to-r from-sunken via-sunken/10 to-transparent" />
          </div>
        </div>
      </section>

      {catalogError ? (
        <section className="mx-auto max-w-[1440px] px-4 py-12 lg:px-8"><AsyncError error={catalogError} onRetry={() => { cats.reload(); fresh.reload(); }} /></section>
      ) : (
        <>
          {/* CATEGORIES */}
          <section className="mx-auto max-w-[1440px] px-4 py-14 lg:px-8" aria-label="Shop by category">
            <SectionHead eyebrow="Explore" title="Shop by category" href="/shop" />
            {cats.loading && !cats.data ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">{Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className="aspect-[3/4] rounded-2xl" />)}</div>
            ) : (
              <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
                {(cats.data ?? []).map((c) => (
                  <li key={c.id}>
                    <Link href={`/shop?category=${c.id}`} className="group relative block aspect-[3/4] overflow-hidden rounded-2xl bg-sunken">
                      <SafeImage src={c.image_url} alt="" width={400} className="size-full transition duration-500 group-hover:scale-105" />
                      <span className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" />
                      <span className="absolute inset-x-3 bottom-3 text-sm font-semibold text-white">{c.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* NEW ARRIVALS */}
          <section className="mx-auto max-w-[1440px] px-4 pb-14 lg:px-8" aria-label="New arrivals">
            <SectionHead eyebrow="Just in" title="New arrivals" href="/shop?sort=newest" />
            {fresh.loading && !fresh.data ? <ProductGridSkeleton count={8} /> : <ProductGrid products={fresh.data?.items ?? []} className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4" />}
          </section>
        </>
      )}

      <AISlot request={{ context: "home", limit: 4 }} title="Picked for you" />

      {/* AI BAND */}
      <section className="px-4 lg:px-8" aria-label="VisionCart AI">
        <div className="mx-auto grid max-w-[1440px] items-center gap-8 overflow-hidden rounded-[2rem] bg-ink px-6 py-12 text-white sm:px-12 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-[#B9B3FF]"><Icon name="sparkles" size={14} />Meet your AI stylist</span>
            <h2 className="mt-5 font-display text-3xl font-semibold leading-tight sm:text-4xl">Tell it the occasion and the budget. It builds the look.</h2>
            <p className="mt-4 max-w-xl text-white/70">Describe what you need in your own words, or set a budget and let the outfit builder assemble pieces that go together.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <ButtonLink href="/ai-shopping" variant="ai" size="lg"><Icon name="sparkles" size={18} />Chat with the stylist</ButtonLink>
              <ButtonLink href="/ai-shopping/outfit-builder" variant="outline" size="lg" className="border-white/30 bg-transparent text-white hover:border-white hover:bg-white/10"><Icon name="layers" size={18} />Build an outfit</ButtonLink>
            </div>
          </div>
          <ul className="grid gap-3 text-sm sm:grid-cols-3 lg:grid-cols-1">
            {[["Budget-aware", "Set a ceiling and see exactly where each rupee goes."], ["Complete looks", "Tops, bottoms, footwear and accessories that work together."], ["Occasion-ready", "Weddings, work, travel — tell it where you're headed."]].map(([t, d]) => (
              <li key={t} className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10"><p className="font-semibold">{t}</p><p className="mt-1 text-white/60">{d}</p></li>
            ))}
          </ul>
        </div>
      </section>

      {/* DEALS */}
      {deals.data && deals.data.items.length > 0 && (
        <section className="mx-auto max-w-[1440px] px-4 py-14 lg:px-8" aria-label="Top deals">
          <SectionHead eyebrow="Limited time" title="Top deals" href="/shop?sale=1&sort=discount" />
          <ProductGrid products={deals.data.items} className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4" />
        </section>
      )}
    </>
  );
}
