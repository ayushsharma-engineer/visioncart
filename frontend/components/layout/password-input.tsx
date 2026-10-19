"use client";

import { useState, type InputHTMLAttributes } from "react";
import { Input } from "../ui/field";

export function PasswordInput({ error, ...rest }: InputHTMLAttributes<HTMLInputElement> & { error?: string | null }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input {...rest} error={error} type={show ? "text" : "password"} className="pr-16" />
      <button type="button" onClick={() => setShow((s) => !s)} aria-pressed={show} aria-label={show ? "Hide password" : "Show password"}
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full px-2 py-1 text-xs font-semibold text-muted hover:text-ink">{show ? "Hide" : "Show"}</button>
    </div>
  );
}
