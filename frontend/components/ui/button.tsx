import Link from "next/link";
import type { ButtonHTMLAttributes, ComponentProps } from "react";
import { cn } from "@/lib/core/utils";

export type ButtonVariant = "primary" | "dark" | "outline" | "ghost" | "ai" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-brand text-white hover:bg-brand-hover disabled:bg-line-strong disabled:text-muted",
  dark: "bg-ink text-white hover:bg-ink-soft disabled:bg-line-strong disabled:text-muted",
  outline: "border border-line-strong bg-surface text-ink hover:border-ink disabled:text-faint disabled:hover:border-line-strong",
  ghost: "text-ink hover:bg-sunken disabled:text-faint",
  ai: "bg-ai text-white hover:bg-ai-hover disabled:bg-line-strong disabled:text-muted",
  danger: "bg-danger text-white hover:opacity-90 disabled:bg-line-strong disabled:text-muted",
};
const SIZES: Record<ButtonSize, string> = {
  sm: "h-9 px-3.5 text-sm gap-1.5",
  md: "h-11 px-5 text-sm gap-2",
  lg: "h-13 px-7 text-base gap-2",
};

export function buttonClasses(o: { variant?: ButtonVariant; size?: ButtonSize; full?: boolean; className?: string } = {}) {
  const { variant = "primary", size = "md", full, className } = o;
  return cn(
    "inline-flex items-center justify-center rounded-full font-semibold transition active:scale-[0.98] select-none whitespace-nowrap",
    VARIANTS[variant], SIZES[size], full && "w-full", className,
  );
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant; size?: ButtonSize; full?: boolean; loading?: boolean;
}

export function Button({ variant, size, full, loading, className, children, disabled, type = "button", ...rest }: ButtonProps) {
  return (
    <button type={type} disabled={disabled || loading} aria-busy={loading || undefined}
      className={buttonClasses({ variant, size, full, className })} {...rest}>
      {loading && <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />}
      {children}
    </button>
  );
}

type LinkProps = ComponentProps<typeof Link> & { variant?: ButtonVariant; size?: ButtonSize; full?: boolean };
export function ButtonLink({ variant, size, full, className, ...rest }: LinkProps) {
  return <Link className={buttonClasses({ variant, size, full, className })} {...rest} />;
}
