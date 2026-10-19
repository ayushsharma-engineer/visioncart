"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { RequireAuth } from "@/components/providers/require-auth";
import { Icon, type IconName } from "@/components/ui/icon";
import { cn } from "@/lib/core/utils";

const NAV: { href: string; label: string; icon: IconName }[] = [
  { href: "/account", label: "Profile", icon: "user" },
  { href: "/account/orders", label: "Orders", icon: "package" },
  { href: "/account/addresses", label: "Addresses", icon: "map-pin" },
  { href: "/wishlist", label: "Wishlist", icon: "heart" },
];

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <RequireAuth>
      <div className="mx-auto max-w-[1280px] px-4 py-8 lg:px-8">
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">My account</h1>
        <div className="mt-8 grid gap-8 lg:grid-cols-[240px_1fr]">
          <nav aria-label="Account" className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
            {NAV.map((n) => {
              const active = n.href === "/account" ? pathname === "/account" : pathname.startsWith(n.href);
              return (
                <Link key={n.href} href={n.href} aria-current={active ? "page" : undefined}
                  className={cn("flex shrink-0 items-center gap-3 rounded-full px-4 py-2.5 text-sm font-medium transition lg:rounded-xl", active ? "bg-ink text-white" : "text-ink-soft hover:bg-sunken")}>
                  <Icon name={n.icon} size={17} />{n.label}
                </Link>
              );
            })}
          </nav>
          <div className="min-w-0">{children}</div>
        </div>
      </div>
    </RequireAuth>
  );
}
