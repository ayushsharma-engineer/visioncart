"use client";

import type { ReactNode } from "react";
import { config } from "@/lib/config";
import { isNotConnected, describeError, isApiError } from "@/lib/core/errors";
import { Icon, type IconName } from "./icon";
import { Button, ButtonLink } from "./button";

export function EmptyState({ icon = "bag", title, text, action }: { icon?: IconName; title: string; text?: string; action?: { label: string; href: string } }) {
  return (
    <div className="flex flex-col items-center rounded-3xl border border-dashed border-line-strong bg-surface px-6 py-14 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-sunken text-muted"><Icon name={icon} size={26} /></span>
      <h2 className="mt-5 font-display text-xl font-semibold text-ink">{title}</h2>
      {text && <p className="mt-2 max-w-sm text-sm text-muted">{text}</p>}
      {action && <ButtonLink href={action.href} className="mt-6">{action.label}</ButtonLink>}
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center rounded-3xl border border-danger/20 bg-danger-soft px-6 py-12 text-center">
      <Icon name="alert" size={28} className="text-danger" />
      <h2 className="mt-4 font-display text-lg font-semibold text-ink">Something went wrong</h2>
      <p className="mt-1 max-w-md text-sm text-ink-soft">{describeError(error)}</p>
      {onRetry && <Button variant="dark" size="sm" className="mt-5" onClick={onRetry}>Try again</Button>}
    </div>
  );
}

/**
 * Honest placeholder for a feature whose backend isn't built yet.
 * Shoppers get plain language; developers (dev builds only) also see exactly what's missing.
 */
export function NotConnected({ domain, needs = [], compact = false, children }: { domain: string; needs?: string[]; compact?: boolean; children?: ReactNode }) {
  return (
    <div role="status" className={`rounded-3xl border border-line bg-surface ${compact ? "p-5" : "px-6 py-12"} text-center`}>
      <span className={`mx-auto flex items-center justify-center rounded-full bg-warn-soft text-warn ${compact ? "size-10" : "size-14"}`}><Icon name="plug" size={compact ? 20 : 26} /></span>
      <h2 className={`font-display font-semibold text-ink ${compact ? "mt-3 text-base" : "mt-5 text-xl"}`}>{domain}: not available yet</h2>
      <p className="mx-auto mt-1.5 max-w-md text-sm text-muted">This part of VisionCart is still being connected. Please check back soon.</p>
      {children}
      {config.isDev && needs.length > 0 && (
        <details className="mx-auto mt-4 max-w-md rounded-xl bg-sunken p-3 text-left text-xs text-ink-soft">
          <summary className="cursor-pointer font-semibold">Developer details: backend work needed</summary>
          <ul className="mt-2 list-disc space-y-1 pl-4">{needs.map((n) => <li key={n}>{n}</li>)}</ul>
        </details>
      )}
    </div>
  );
}

/** Renders the right state for a failed service call. */
export function AsyncError({ error, onRetry, needs }: { error: unknown; onRetry?: () => void; needs?: string[] }) {
  if (isNotConnected(error)) return <NotConnected domain={error.domain} needs={needs ?? error.needs} />;
  if (isApiError(error) && error.status === 404) return <EmptyState icon="search" title="Not found" text={error.message} action={{ label: "Back to shop", href: "/shop" }} />;
  return <ErrorState error={error} onRetry={onRetry} />;
}
