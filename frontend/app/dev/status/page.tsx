"use client";

import { notFound } from "next/navigation";
import { config } from "@/lib/config";
import { integration, type IntegrationState } from "@/lib/services";
import { Badge, type Tone } from "@/components/ui/badge";

const TONE: Record<IntegrationState, Tone> = { live: "success", fixtures: "warn", local: "neutral", missing: "danger" };
const LABEL: Record<IntegrationState, string> = { live: "Live", fixtures: "Fixtures", local: "This browser", missing: "Not connected" };

export default function StatusPage() {
  if (!config.isDev && config.dataMode !== "fixtures") notFound();
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="font-display text-3xl font-semibold">Integration status</h1>
      <p className="mt-2 text-sm text-muted">What each part of the storefront is actually connected to. Data mode: <strong>{config.dataMode}</strong>. Full details and the proposed API contracts are in <code className="rounded bg-sunken px-1.5 py-0.5">frontend/INTEGRATION.md</code>.</p>
      <ul className="mt-8 divide-y divide-line rounded-3xl border border-line bg-surface">
        {Object.entries(integration).map(([key, i]) => (
          <li key={key} className="flex flex-wrap items-center gap-3 p-5">
            <div className="min-w-0 flex-1"><p className="font-semibold">{i.label}</p><p className="text-sm text-muted">{i.detail}</p></div>
            <Badge tone={TONE[i.state]}>{LABEL[i.state]}</Badge>
          </li>
        ))}
      </ul>
    </div>
  );
}
