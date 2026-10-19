import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/core/utils";

const CONTROL =
  "w-full rounded-xl border bg-surface px-4 text-sm text-ink outline-none transition placeholder:text-faint " +
  "focus:border-ink focus:ring-4 focus:ring-ink/10 disabled:bg-sunken disabled:text-muted";

export function controlClass(error?: string | null, extra?: string) {
  return cn(CONTROL, error ? "border-danger focus:border-danger focus:ring-danger/10" : "border-line-strong", extra);
}

interface FieldProps {
  label: string; error?: string | null; hint?: string; optional?: boolean;
  children: (p: { id: string; "aria-invalid": boolean; "aria-describedby"?: string }) => ReactNode;
  className?: string;
}

export function Field({ label, error, hint, optional, children, className }: FieldProps) {
  const id = useId();
  const descId = error || hint ? `${id}-d` : undefined;
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 flex items-baseline justify-between text-sm font-medium text-ink">
        <span>{label}</span>
        {optional && <span className="text-xs font-normal text-faint">Optional</span>}
      </label>
      {children({ id, "aria-invalid": !!error, "aria-describedby": descId })}
      {error ? <p id={descId} role="alert" className="mt-1.5 text-xs text-danger">{error}</p>
        : hint ? <p id={descId} className="mt-1.5 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

export function Input({ error, className, ...rest }: InputHTMLAttributes<HTMLInputElement> & { error?: string | null }) {
  return <input className={controlClass(error, cn("h-12", className))} {...rest} />;
}
export function Textarea({ error, className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: string | null }) {
  return <textarea className={controlClass(error, cn("min-h-28 py-3", className))} {...rest} />;
}
export function Select({ error, className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement> & { error?: string | null }) {
  return <select className={controlClass(error, cn("h-12 appearance-none bg-[length:16px] bg-[right_1rem_center] bg-no-repeat pr-10", className))}
    style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236b645b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")" }} {...rest}>{children}</select>;
}

export function Checkbox({ label, className, ...rest }: InputHTMLAttributes<HTMLInputElement> & { label: ReactNode }) {
  return (
    <label className={cn("flex cursor-pointer items-center gap-2.5 text-sm text-ink-soft", className)}>
      <input type="checkbox" className="size-4 rounded border-line-strong accent-ink" {...rest} />
      <span>{label}</span>
    </label>
  );
}
