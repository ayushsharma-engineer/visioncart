"use client";

import { useState } from "react";
import { cn } from "@/lib/core/utils";
import { Icon } from "./icon";

/** Unsplash accepts a width param; request roughly what we render. Other hosts are untouched. */
export function sizedUrl(url: string, width: number): string {
  if (!url.includes("images.unsplash.com")) return url;
  return url.replace(/([?&])w=\d+/, `$1w=${width}`);
}

/**
 * Plain <img> on purpose: product image_url values come from arbitrary seller-supplied
 * hosts, which next/image can't allow-list ahead of time. Failure shows a tidy placeholder.
 */
export function SafeImage({ src, alt, width = 600, className, eager }: { src: string | null | undefined; alt: string; width?: number; className?: string; eager?: boolean }) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  if (!src || failedSrc === src) {
    return (
      <div role="img" aria-label={alt} className={cn("flex items-center justify-center bg-sunken text-faint", className)}>
        <Icon name="image" size={28} />
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={sizedUrl(src, width)} alt={alt} loading={eager ? "eager" : "lazy"} decoding="async"
      onError={() => setFailedSrc(src)} className={cn("bg-sunken object-cover", className)} />
  );
}
