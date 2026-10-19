import { cn } from "@/lib/core/utils";
import { Icon } from "./icon";

function pages(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const out: (number | "…")[] = [1];
  const lo = Math.max(2, current - 1), hi = Math.min(total - 1, current + 1);
  if (lo > 2) out.push("…");
  for (let i = lo; i <= hi; i++) out.push(i);
  if (hi < total - 1) out.push("…");
  out.push(total);
  return out;
}

export function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) {
  if (totalPages <= 1) return null;
  const btn = "flex size-10 items-center justify-center rounded-full text-sm font-medium transition";
  return (
    <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-1.5">
      <button type="button" aria-label="Previous page" disabled={page <= 1} onClick={() => onChange(page - 1)} className={cn(btn, "border border-line-strong hover:border-ink disabled:text-faint disabled:hover:border-line-strong")}><Icon name="chevron-left" size={18} /></button>
      {pages(page, totalPages).map((p, i) => p === "…" ? <span key={`e${i}`} className="px-1 text-faint">…</span> : (
        <button key={p} type="button" aria-label={`Page ${p}`} aria-current={p === page ? "page" : undefined} onClick={() => onChange(p)}
          className={cn(btn, p === page ? "bg-ink text-white" : "hover:bg-sunken")}>{p}</button>
      ))}
      <button type="button" aria-label="Next page" disabled={page >= totalPages} onClick={() => onChange(page + 1)} className={cn(btn, "border border-line-strong hover:border-ink disabled:text-faint disabled:hover:border-line-strong")}><Icon name="chevron-right" size={18} /></button>
    </nav>
  );
}
