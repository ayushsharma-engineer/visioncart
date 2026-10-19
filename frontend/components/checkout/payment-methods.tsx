"use client";

import type { PaymentMethod } from "@/lib/services";
import { cn } from "@/lib/core/utils";
import { Icon, type IconName } from "../ui/icon";

export const PAYMENT_METHODS: { id: PaymentMethod; label: string; hint: string; icon: IconName; online: boolean }[] = [
  { id: "upi", label: "UPI", hint: "Google Pay, PhonePe, Paytm and more", icon: "phone", online: true },
  { id: "card", label: "Credit / Debit card", hint: "Visa, Mastercard, RuPay", icon: "card", online: true },
  { id: "netbanking", label: "Net banking", hint: "All major Indian banks", icon: "bank", online: true },
  { id: "wallet", label: "Wallets", hint: "Popular mobile wallets", icon: "wallet", online: true },
  { id: "cod", label: "Cash on delivery", hint: "Pay when your order arrives", icon: "cash", online: false },
];

export function PaymentMethodPicker({ value, onChange, onlineAvailable }: { value: PaymentMethod | null; onChange: (m: PaymentMethod) => void; onlineAvailable: boolean }) {
  return (
    <div role="radiogroup" aria-label="Payment method" className="space-y-3">
      {PAYMENT_METHODS.map((m) => {
        const disabled = m.online && !onlineAvailable;
        const on = value === m.id;
        return (
          <button key={m.id} type="button" role="radio" aria-checked={on} disabled={disabled} onClick={() => onChange(m.id)}
            className={cn("flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition", on ? "border-ink ring-2 ring-ink/10" : "border-line hover:border-line-strong", disabled && "cursor-not-allowed opacity-50 hover:border-line")}>
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-sunken"><Icon name={m.icon} size={20} /></span>
            <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{m.label}</span><span className="block text-xs text-muted">{disabled ? "Online payments aren't connected yet" : m.hint}</span></span>
            <span className={cn("flex size-5 items-center justify-center rounded-full border-2", on ? "border-ink bg-ink text-white" : "border-line-strong")}>{on && <Icon name="check" size={12} />}</span>
          </button>
        );
      })}
    </div>
  );
}
