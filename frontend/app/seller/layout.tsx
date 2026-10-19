"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { seller } from "@/lib/services";
import { useAsync } from "@/lib/hooks/use-async";
import { describeError } from "@/lib/core/errors";
import { cn } from "@/lib/core/utils";
import { RequireAuth } from "@/components/providers/require-auth";
import { useToast } from "@/components/providers/toast";
import { AsyncError } from "@/components/ui/states";
import { Skeleton } from "@/components/ui/skeleton";
import { Field, Input, Textarea } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Icon, type IconName } from "@/components/ui/icon";

const NAV: { href: string; label: string; icon: IconName }[] = [
  { href: "/seller", label: "Overview", icon: "chart" },
  { href: "/seller/products", label: "Products", icon: "tag" },
  { href: "/seller/orders", label: "Orders", icon: "package" },
];

function Onboarding({ onDone }: { onDone: () => void }) {
  const toast = useToast();
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setErr("Give your store a name."); return; }
    setBusy(true); setErr(null);
    try { await seller.register({ store_name: name.trim(), description: desc.trim() || null }); toast.success("Your store is ready"); onDone(); }
    catch (ex) { setErr(describeError(ex)); } finally { setBusy(false); }
  };
  return (
    <div className="mx-auto max-w-xl rounded-3xl border border-line bg-surface p-8">
      <span className="flex size-12 items-center justify-center rounded-full bg-brand-soft text-brand"><Icon name="store" size={22} /></span>
      <h1 className="mt-5 font-display text-3xl font-semibold">Sell on VisionCart</h1>
      <p className="mt-2 text-sm text-muted">Create your store to list products and reach shoppers across India.</p>
      <form onSubmit={submit} noValidate className="mt-6 space-y-4">
        {err && <div role="alert" className="rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">{err}</div>}
        <Field label="Store name">{(p) => <Input {...p} value={name} maxLength={150} onChange={(e) => setName(e.target.value)} />}</Field>
        <Field label="About your store" optional>{(p) => <Textarea {...p} value={desc} onChange={(e) => setDesc(e.target.value)} />}</Field>
        <Button type="submit" variant="dark" size="lg" full loading={busy}>Create store</Button>
      </form>
    </div>
  );
}

function SellerGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: profile, error, loading, reload } = useAsync("seller:me", (s) => seller.getMe({ signal: s }));

  if (error) return <div className="mx-auto max-w-3xl px-4 py-16"><AsyncError error={error} onRetry={reload} /></div>;
  if (loading && profile === undefined) return <div className="mx-auto max-w-5xl space-y-4 px-4 py-16"><Skeleton className="h-10 w-1/3" /><Skeleton className="h-48" /></div>;
  if (profile === null) return <div className="px-4 py-12"><Onboarding onDone={reload} /></div>;

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-8 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-widest text-brand">Seller dashboard</p><h1 className="font-display text-3xl font-semibold tracking-tight">{profile?.store_name}</h1></div></div>
      <div className="mt-8 grid gap-8 lg:grid-cols-[220px_1fr]">
        <nav aria-label="Seller" className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
          {NAV.map((n) => { const active = n.href === "/seller" ? pathname === "/seller" : pathname.startsWith(n.href);
            return <Link key={n.href} href={n.href} aria-current={active ? "page" : undefined} className={cn("flex shrink-0 items-center gap-3 rounded-full px-4 py-2.5 text-sm font-medium lg:rounded-xl", active ? "bg-ink text-white" : "text-ink-soft hover:bg-sunken")}><Icon name={n.icon} size={17} />{n.label}</Link>; })}
        </nav>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  return <RequireAuth><SellerGate>{children}</SellerGate></RequireAuth>;
}
