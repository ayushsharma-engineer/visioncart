"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/lib/stores/cart";
import { cn } from "@/lib/core/utils";
import { Icon, type IconName } from "../ui/icon";

const TABS: { href: string; label: string; icon: IconName; match: (p: string) => boolean }[] = [
  { href: "/", label: "Home", icon: "home", match: (p) => p === "/" },
  { href: "/shop", label: "Shop", icon: "grid", match: (p) => p.startsWith("/shop") || p.startsWith("/product") },
  { href: "/ai-shopping", label: "AI", icon: "sparkles", match: (p) => p.startsWith("/ai-shopping") },
  { href: "/cart", label: "Bag", icon: "bag", match: (p) => p.startsWith("/cart") || p.startsWith("/checkout") },
  { href: "/account", label: "Account", icon: "user", match: (p) => p.startsWith("/account") || p === "/login" || p === "/register" || p.startsWith("/wishlist") },
];

export function MobileTabBar() {
  const pathname = usePathname();
  const { totals } = useCart();
  return (
    <nav aria-label="Primary" className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 backdrop-blur md:hidden">
      <ul className="grid grid-cols-5">
        {TABS.map((t) => {
          const active = t.match(pathname);
          const ai = t.icon === "sparkles";
          return (
            <li key={t.href}>
              <Link href={t.href} aria-current={active ? "page" : undefined}
                className={cn("relative flex h-16 flex-col items-center justify-center gap-0.5 text-[11px] font-medium", active ? "text-ink" : "text-muted")}>
                <span className={cn("relative flex items-center justify-center", ai && "size-9 rounded-full bg-ai text-white shadow-card")}>
                  <Icon name={t.icon} size={ai ? 18 : 22} filled={active && !ai && t.icon === "home"} />
                  {t.icon === "bag" && totals.itemCount > 0 && <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold text-white">{totals.itemCount}</span>}
                </span>
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
