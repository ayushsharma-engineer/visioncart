import Link from "next/link";
import { cn } from "@/lib/core/utils";

export function Brand({ className, inverted }: { className?: string; inverted?: boolean }) {
  return (
    <Link href="/" aria-label="VisionCart home" className={cn("inline-flex items-baseline font-display text-2xl font-semibold tracking-tight", inverted ? "text-white" : "text-ink", className)}>
      Vision<span className={inverted ? "text-[#FF9A7A]" : "text-brand"}>Cart</span>
      <span className={cn("ml-1 text-[10px] font-sans font-bold tracking-widest", inverted ? "text-white/60" : "text-ai")}>AI</span>
    </Link>
  );
}
