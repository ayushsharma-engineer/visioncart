import type { ReactNode } from "react";
import { Brand } from "./brand";
import { Icon } from "../ui/icon";

const POINTS = [
  ["Tell it your budget", "Set a ceiling and see where every rupee goes."],
  ["Complete looks", "Pieces that work together, for every occasion."],
  ["Orders in one place", "Track what you've bought and manage your addresses."],
];

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="grid min-h-[calc(100dvh-7rem)] lg:grid-cols-2">
      <section className="relative hidden overflow-hidden bg-ink lg:flex">
        <div className="absolute -left-24 -top-24 size-96 rounded-full bg-brand/30 blur-3xl" />
        <div className="absolute -bottom-32 -right-24 size-96 rounded-full bg-ai/30 blur-3xl" />
        <div className="relative z-10 flex w-full flex-col justify-between p-12 xl:p-16">
          <Brand inverted />
          <div className="max-w-lg">
            <h2 className="font-display text-5xl font-semibold leading-[1.05] text-white">Shopping that understands you.</h2>
            <ul className="mt-10 space-y-5">
              {POINTS.map(([t, d]) => (
                <li key={t} className="flex gap-4"><span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-white"><Icon name="check" size={16} /></span>
                  <div><p className="text-sm font-semibold text-white">{t}</p><p className="mt-0.5 text-sm text-white/60">{d}</p></div></li>
              ))}
            </ul>
          </div>
          <p className="text-xs text-white/50">© {new Date().getFullYear()} VisionCart</p>
        </div>
      </section>
      <section className="flex items-center justify-center px-5 py-12 sm:px-8">
        <div className="w-full max-w-md">
          <h1 className="font-display text-4xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-2 text-sm text-muted">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </section>
    </div>
  );
}
