"use client";

import { ErrorState } from "@/components/ui/states";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <div className="mx-auto max-w-3xl px-4 py-20"><ErrorState error={error} onRetry={reset} /></div>;
}
