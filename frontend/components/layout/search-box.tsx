"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { catalog } from "@/lib/services";
import { useAsync } from "@/lib/hooks/use-async";
import { useDebounced } from "@/lib/hooks/misc";
import { money } from "@/lib/format";
import { Icon } from "../ui/icon";
import { SafeImage } from "../ui/safe-image";
import { cn } from "@/lib/core/utils";

export function SearchBox({ className, autoFocus, onDone }: { className?: string; autoFocus?: boolean; onDone?: () => void }) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const term = useDebounced(value.trim(), 250);

  // Suggestions are best-effort: if the catalog isn't connected we simply show none.
  const { data } = useAsync(`suggest:${term}`, async (signal) => {
    if (term.length < 2) return null;
    try { return await catalog.listProducts({ q: term, pageSize: 5 }, { signal }); } catch { return null; }
  });
  const suggestions = term.length >= 2 ? (data?.items ?? []) : [];

  const submit = (q: string) => {
    const t = q.trim();
    setOpen(false);
    router.push(t ? `/shop?q=${encodeURIComponent(t)}` : "/shop");
    onDone?.();
  };

  return (
    <div ref={wrap} className={cn("relative", className)}
      onBlur={(e) => { if (!wrap.current?.contains(e.relatedTarget as Node)) setOpen(false); }}>
      <form role="search" onSubmit={(e) => { e.preventDefault(); submit(value); }} className="relative">
        <label htmlFor="site-search" className="sr-only">Search products</label>
        <Icon name="search" size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
        <input id="site-search" type="search" value={value} autoFocus={autoFocus} autoComplete="off"
          onChange={(e) => { setValue(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)}
          onKeyDown={(e) => { if (e.key === "Escape") setOpen(false); }}
          placeholder="Search dresses, shoes, brands…"
          className="h-11 w-full rounded-full border border-line bg-sunken pl-11 pr-4 text-sm outline-none transition placeholder:text-muted focus:border-ink focus:bg-surface" />
      </form>
      {open && suggestions.length > 0 && (
        <div className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-line bg-surface shadow-lift">
          <ul>
            {suggestions.map((p) => (
              <li key={p.id}>
                <Link href={`/product/${p.id}`} onClick={() => { setOpen(false); onDone?.(); }} className="flex items-center gap-3 px-3 py-2.5 hover:bg-sunken">
                  <SafeImage src={p.image_url} alt="" width={96} className="size-11 shrink-0 rounded-lg" />
                  <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{p.name}</span><span className="block text-xs text-muted">{p.brand ?? p.category?.name}</span></span>
                  <span className="text-sm font-semibold">{money(p.price)}</span>
                </Link>
              </li>
            ))}
          </ul>
          <button type="button" onClick={() => submit(value)} className="flex w-full items-center justify-between border-t border-line px-4 py-3 text-sm font-semibold text-brand hover:bg-sunken">
            See all results for “{term}” <Icon name="arrow-right" size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
