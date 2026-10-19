import { discountPercent } from "@/lib/core/money";
import { money } from "@/lib/format";
import { cn } from "@/lib/core/utils";

export function Price({ price, compareAt, size = "md", className }: { price: number; compareAt?: number | null; size?: "sm" | "md" | "lg"; className?: string }) {
  const off = discountPercent(price, compareAt);
  const sz = size === "lg" ? "text-2xl" : size === "sm" ? "text-sm" : "text-base";
  return (
    <div className={cn("flex flex-wrap items-baseline gap-x-2", className)}>
      <span className={cn("font-semibold text-ink", sz)}>{money(price)}</span>
      {off > 0 && compareAt && (
        <>
          <span className="text-xs text-faint line-through"><span className="sr-only">Original price </span>{money(compareAt)}</span>
          <span className="text-xs font-semibold text-success">{off}% off</span>
        </>
      )}
    </div>
  );
}
