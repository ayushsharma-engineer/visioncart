import type { ReactNode } from "react";
import { cn } from "@/lib/core/utils";

const TONES = {
  neutral: "bg-sunken text-ink-soft",
  brand: "bg-brand-soft text-brand",
  ai: "bg-ai-soft text-ai",
  success: "bg-success-soft text-success",
  warn: "bg-warn-soft text-warn",
  danger: "bg-danger-soft text-danger",
  dark: "bg-ink text-white",
} as const;
export type Tone = keyof typeof TONES;

export function Badge({ tone = "neutral", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold", TONES[tone], className)}>{children}</span>;
}
