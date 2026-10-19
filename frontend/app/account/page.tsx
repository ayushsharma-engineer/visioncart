"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth";
import { useDocumentTitle } from "@/lib/hooks/misc";
import { initials } from "@/lib/core/utils";
import { Button, ButtonLink } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

export default function ProfilePage() {
  useDocumentTitle("My profile");
  const { user, logout } = useAuth();
  const router = useRouter();
  if (!user) return null;

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-center gap-5 rounded-3xl border border-line bg-surface p-6">
        <span className="flex size-16 items-center justify-center rounded-full bg-ink font-display text-xl font-semibold text-white">{initials(user.name)}</span>
        <div className="min-w-0"><h2 className="truncate font-display text-2xl font-semibold">{user.name}</h2><p className="truncate text-sm text-muted">{user.email}</p></div>
      </section>

      <section className="rounded-3xl border border-line bg-surface p-6" aria-labelledby="det-h">
        <h2 id="det-h" className="font-display text-lg font-semibold">Account details</h2>
        <dl className="mt-4 divide-y divide-line text-sm">
          <div className="grid grid-cols-[120px_1fr] py-3"><dt className="text-muted">Name</dt><dd>{user.name}</dd></div>
          <div className="grid grid-cols-[120px_1fr] py-3"><dt className="text-muted">Email</dt><dd>{user.email}</dd></div>
          <div className="grid grid-cols-[120px_1fr] py-3"><dt className="text-muted">Customer ID</dt><dd>#{user.id}</dd></div>
        </dl>
        <p className="mt-4 flex items-start gap-2 rounded-xl bg-sunken p-3 text-xs text-muted"><Icon name="info" size={14} className="mt-0.5 shrink-0" />Editing your name, email or password isn&apos;t available yet — the server doesn&apos;t offer those actions.</p>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {[["/account/orders", "package", "Orders", "Track and review purchases"], ["/account/addresses", "map-pin", "Addresses", "Manage delivery addresses"], ["/wishlist", "heart", "Wishlist", "Items saved on this device"]].map(([href, icon, t, d]) => (
          <ButtonLink key={href} href={href} variant="outline" className="!h-auto flex-col items-start !whitespace-normal !rounded-2xl p-5 text-left"><Icon name={icon as "package"} size={20} className="text-brand" /><span className="mt-3 text-sm font-semibold">{t}</span><span className="text-xs font-normal text-muted">{d}</span></ButtonLink>
        ))}
      </section>

      <Button variant="outline" onClick={async () => { await logout(); router.push("/"); }}><Icon name="logout" size={16} />Sign out</Button>
    </div>
  );
}
