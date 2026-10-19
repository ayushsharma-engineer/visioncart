"use client";

import { useState } from "react";
import { cn } from "@/lib/core/utils";
import { Icon } from "./icon";

export function Stars({ value, size = 14, className }: { value: number; size?: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-0.5 text-[#E9A82E]", className)} role="img" aria-label={`${value.toFixed(1)} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = Math.max(0, Math.min(1, value - (i - 1)));
        return (
          <span key={i} className="relative inline-block" style={{ width: size, height: size }}>
            <Icon name="star" size={size} className="absolute inset-0 text-line-strong" filled />
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <Icon name="star" size={size} filled />
            </span>
          </span>
        );
      })}
    </span>
  );
}

export function RatingInput({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <div className="flex gap-1" role="radiogroup" aria-label="Your rating" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" role="radio" aria-checked={value === n} aria-label={`${n} star${n > 1 ? "s" : ""}`}
          onClick={() => onChange(n)} onMouseEnter={() => setHover(n)}
          className={cn("p-0.5 transition", n <= shown ? "text-[#E9A82E]" : "text-line-strong")}>
          <Icon name="star" size={28} filled />
        </button>
      ))}
    </div>
  );
}
