"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../providers/auth";
import { initials } from "@/lib/core/utils";
import { Icon, type IconName } from "../ui/icon";
import { ButtonLink } from "../ui/button";

const ITEMS: { href: string; label: string; icon: IconName }[] = [
  { href: "/account", label: "My profile", icon: "user" },
  { href: "/account/orders", label: "Orders", icon: "package" },
  { href: "/account/addresses", label: "Addresses", icon: "map-pin" },
  { href: "/wishlist", label: "Wishlist", icon: "heart" },
  { href: "/seller", label: "Seller dashboard", icon: "store" },
];

export function AccountMenu() {
  const { status, user, logout } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);

  if (status === "loading") return <div className="size-10" aria-hidden="true" />;
  if (status === "anonymous") {
    return <ButtonLink href="/login" variant="dark" size="sm" className="ml-1">Sign in</ButtonLink>;
  }

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-haspopup="menu" aria-expanded={open} aria-label="Account menu"
        className="flex size-10 items-center justify-center rounded-full bg-ink text-xs font-bold text-white hover:bg-ink-soft">
        {initials(user?.name ?? "")}
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-full z-50 mt-2 w-60 overflow-hidden rounded-2xl border border-line bg-surface py-2 shadow-lift">
          <div className="border-b border-line px-4 pb-3 pt-1">
            <p className="truncate text-sm font-semibold">{user?.name}</p>
            <p className="truncate text-xs text-muted">{user?.email}</p>
          </div>
          {ITEMS.map((i) => (
            <Link key={i.href} href={i.href} role="menuitem" onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-sunken">
              <Icon name={i.icon} size={17} className="text-muted" />{i.label}
            </Link>
          ))}
          <button type="button" role="menuitem" onClick={async () => { setOpen(false); await logout(); router.push("/"); }}
            className="flex w-full items-center gap-3 border-t border-line px-4 py-2.5 text-left text-sm text-danger hover:bg-sunken">
            <Icon name="logout" size={17} />Sign out
          </button>
        </div>
      )}
    </div>
  );
}
