"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { catalog } from "@/lib/services";
import { useAsync } from "@/lib/hooks/use-async";
import { useCart } from "@/lib/stores/cart";
import { useWishlist } from "@/lib/stores/wishlist";
import { config } from "@/lib/config";
import { money } from "@/lib/format";
import { cn } from "@/lib/core/utils";
import { Icon } from "../ui/icon";
import { Sheet } from "../ui/sheet";
import { Brand } from "./brand";
import { SearchBox } from "./search-box";
import { AccountMenu } from "./account-menu";
import { useAuth } from "../providers/auth";
import { useRouter } from "next/navigation";

function CountBadge({ n }: { n: number }) {
  if (n <= 0) return null;
  return <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold text-white">{n > 99 ? "99+" : n}</span>;
}

export function Header() {
  const pathname = usePathname();
  const { totals } = useCart();
  const { entries } = useWishlist();
  const [drawer, setDrawer] = useState(false);
  const [mobileSearch, setMobileSearch] = useState(false);
  const { status, logout } = useAuth();
  const router = useRouter();

  // Category nav is best-effort; if the catalog isn't connected the nav simply omits it.
  const { data: categories } = useAsync("nav-categories", async (s) => { try { return await catalog.listCategories({ signal: s }); } catch { return []; } });

  const iconBtn = "relative flex size-10 items-center justify-center rounded-full text-ink hover:bg-sunken";
  const navLink = (href: string, active: boolean) => cn("whitespace-nowrap text-sm font-medium transition hover:text-brand", active ? "text-brand" : "text-ink-soft");

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-canvas/95 backdrop-blur">
      <div className="bg-ink px-4 py-2 text-center text-xs font-medium text-white/90">
        Free delivery on orders above {money(config.freeShippingThreshold)} · {config.returnDays}-day easy returns
      </div>

      <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-3 px-4 lg:gap-6 lg:px-8">
        <button type="button" className={cn(iconBtn, "lg:hidden")} aria-label="Open menu" onClick={() => setDrawer(true)}><Icon name="menu" /></button>
        <Brand />

        <nav aria-label="Main" className="ml-4 hidden items-center gap-6 lg:flex">
          <Link href="/shop" className={navLink("/shop", pathname === "/shop")}>Shop all</Link>
          {(categories ?? []).slice(0, 5).map((c) => (
            <Link key={c.id} href={`/shop?category=${c.id}`} className={navLink("", false)}>{c.name}</Link>
          ))}
          <Link href="/shop?sale=1&sort=discount" className="whitespace-nowrap text-sm font-semibold text-brand hover:underline">Deals</Link>
        </nav>

        <SearchBox className="ml-auto hidden max-w-md flex-1 md:block lg:ml-4" />

        <div className="ml-auto flex items-center gap-0.5 md:ml-0">
          <Link href="/ai-shopping" className="mr-1 hidden items-center gap-1.5 rounded-full bg-ai-soft px-3.5 py-2 text-sm font-semibold text-ai hover:bg-ai/15 xl:flex">
            <Icon name="sparkles" size={16} />AI Stylist
          </Link>
          <button type="button" className={cn(iconBtn, "md:hidden")} aria-label="Search" onClick={() => setMobileSearch((s) => !s)}><Icon name="search" /></button>
          <Link href="/wishlist" className={cn(iconBtn, "hidden sm:flex")} aria-label={`Wishlist, ${entries.length} items`}><Icon name="heart" /><CountBadge n={entries.length} /></Link>
          <Link href="/cart" className={iconBtn} aria-label={`Shopping bag, ${totals.itemCount} items`}><Icon name="bag" /><CountBadge n={totals.itemCount} /></Link>
          <div className="hidden md:block"><AccountMenu /></div>
        </div>
      </div>

      {mobileSearch && <div className="border-t border-line px-4 py-3 md:hidden"><SearchBox autoFocus onDone={() => setMobileSearch(false)} /></div>}

      <Sheet open={drawer} onClose={() => setDrawer(false)} title="Menu" side="left">
        <nav className="flex flex-col text-base" onClick={() => setDrawer(false)}>
          <Link href="/ai-shopping" className="mb-3 flex items-center gap-2 rounded-2xl bg-ai-soft px-4 py-3.5 font-semibold text-ai"><Icon name="sparkles" size={18} />AI Stylist</Link>
          <Link href="/shop" className="py-3 font-medium">Shop all</Link>
          {(categories ?? []).map((c) => <Link key={c.id} href={`/shop?category=${c.id}`} className="py-3 text-ink-soft">{c.name}</Link>)}
          <Link href="/shop?sale=1&sort=discount" className="py-3 font-semibold text-brand">Deals</Link>
          <div className="my-2 border-t border-line" />
          <Link href="/ai-shopping/outfit-builder" className="py-3">Outfit builder</Link>
          <Link href="/wishlist" className="py-3">Wishlist</Link>
          {status === "authenticated" ? (
            <>
              <Link href="/account" className="py-3">My account</Link>
              <Link href="/account/orders" className="py-3">Orders</Link>
              <Link href="/seller" className="py-3">Seller dashboard</Link>
              <button type="button" className="py-3 text-left text-danger" onClick={async () => { await logout(); router.push("/"); }}>Sign out</button>
            </>
          ) : (
            <Link href="/login" className="mt-2 rounded-full bg-ink py-3 text-center font-semibold text-white">Sign in</Link>
          )}
        </nav>
      </Sheet>
    </header>
  );
}
