"use client";

import { Icon } from "./icon";

export function QuantityStepper({ value, onChange, min = 1, max = 10, label = "Quantity" }: { value: number; onChange: (n: number) => void; min?: number; max?: number; label?: string }) {
  return (
    <div role="group" aria-label={label} className="inline-flex h-10 items-center rounded-full border border-line-strong bg-surface">
      <button type="button" aria-label="Decrease quantity" disabled={value <= min} onClick={() => onChange(value - 1)} className="flex size-10 items-center justify-center rounded-full text-ink hover:bg-sunken disabled:text-faint disabled:hover:bg-transparent"><Icon name="minus" size={16} /></button>
      <span className="min-w-8 text-center text-sm font-semibold tabular-nums" aria-live="polite">{value}</span>
      <button type="button" aria-label="Increase quantity" disabled={value >= max} onClick={() => onChange(value + 1)} className="flex size-10 items-center justify-center rounded-full text-ink hover:bg-sunken disabled:text-faint disabled:hover:bg-transparent"><Icon name="plus" size={16} /></button>
    </div>
  );
}
