"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/core/utils";
import { useIsClient, useLockBodyScroll } from "@/lib/hooks/misc";
import { Icon } from "./icon";

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

interface SheetProps {
  open: boolean; onClose: () => void; title: string; children: ReactNode;
  side?: "left" | "right" | "bottom"; footer?: ReactNode; className?: string;
}

/** Accessible modal panel: portal, Esc to close, focus trap, restores focus, locks scroll. */
export function Sheet({ open, onClose, title, children, side = "right", footer, className }: SheetProps) {
  const isClient = useIsClient();
  const panel = useRef<HTMLDivElement>(null);
  useLockBodyScroll(open);

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    panel.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.stopPropagation(); onClose(); return; }
      if (e.key !== "Tab" || !panel.current) return;
      const els = [...panel.current.querySelectorAll<HTMLElement>(FOCUSABLE)];
      if (els.length === 0) { e.preventDefault(); return; }
      const first = els[0], last = els[els.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("keydown", onKey); prev?.focus?.(); };
  }, [open, onClose]);

  if (!isClient || !open) return null;

  const pos = side === "bottom"
    ? "inset-x-0 bottom-0 max-h-[88dvh] rounded-t-3xl animate-sheet-bottom"
    : side === "left" ? "inset-y-0 left-0 w-[88%] max-w-sm animate-sheet-left" : "inset-y-0 right-0 w-full max-w-md animate-sheet-right";

  return createPortal(
    <div className="fixed inset-0 z-[70]">
      <div className="absolute inset-0 animate-fade-in bg-ink/45" onClick={onClose} aria-hidden="true" />
      <div ref={panel} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1}
        className={cn("absolute flex flex-col bg-surface shadow-pop outline-none", pos, className)}>
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="font-display text-lg font-semibold">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="flex size-9 items-center justify-center rounded-full hover:bg-sunken"><Icon name="close" /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="border-t border-line px-5 py-4 pb-safe">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
