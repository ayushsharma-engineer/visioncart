
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { readCart, readWishlist } from "@/lib/store";
import { useCustomerAuth } from "@/components/CustomerRouteGuard";

const categories = [
  ["All clothing", "/shop"],
  ["Women", "/women"],
  ["Men", "/men"],
  ["Kids", "/kids"],
];

const USER_KEY = "visioncart_user";
const ACCESS_KEY = "visioncart_access_token";
const REFRESH_KEY = "visioncart_refresh_token";

type Customer = {
  email?: string;
  full_name?: string;
  name?: string;
  first_name?: string;
  role?: string;
};

export default function Navbar() {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [cart, setCart] = useState(0);
  const [wishlist, setWishlist] = useState(0);
  const [user, setUser] = useState<Customer | null>(null);

  const router = useRouter();
  const profileRef = useRef<HTMLDivElement>(null);
  const { requestCustomerAccess } = useCustomerAuth();

  useEffect(() => {
    const refresh = () => {
      setCart(readCart().reduce((total, item) => total + item.quantity, 0));
      setWishlist(readWishlist().length);
    };

    const loadUser = () => {
      try {
        const saved = localStorage.getItem(USER_KEY);
        const parsed = saved ? JSON.parse(saved) : null;
        setUser(
          parsed?.role === "customer" &&
            localStorage.getItem(ACCESS_KEY) &&
            localStorage.getItem(REFRESH_KEY)
            ? parsed
            : null
        );
      } catch {
        setUser(null);
      }
    };

    refresh();
    loadUser();

    window.addEventListener("storage", refresh);
    window.addEventListener("visioncart-storage", refresh);
    window.addEventListener("visioncart-auth", loadUser);
    window.addEventListener("focus", loadUser);

    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("visioncart-storage", refresh);
      window.removeEventListener("visioncart-auth", loadUser);
      window.removeEventListener("focus", loadUser);
    };
  }, []);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = search.trim();
    const destination = query
      ? `/shop?search=${encodeURIComponent(query)}`
      : "/shop";

    void requestCustomerAccess(destination).then((authenticated) => {
      if (authenticated) router.push(destination);
    });
  }

  function logout() {
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    setUser(null);
    setProfileOpen(false);
    window.dispatchEvent(new Event("visioncart-auth"));
    router.push("/");
  }

  const displayName =
    user?.full_name ||
    user?.name ||
    user?.first_name ||
    user?.email?.split("@")[0] ||
    "Customer";

  const initial = displayName.charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur-xl">
      <div className="mx-auto flex min-h-[68px] max-w-[1440px] items-center gap-3 px-4 lg:gap-5 lg:px-8">
        <Link href="/" className="shrink-0 text-2xl font-bold tracking-tight text-gray-950">
          Vision<span className="text-blue-600">Cart</span>
        </Link>

        <div className="relative hidden lg:block">
          <button
            type="button"
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
            className="rounded-md px-3 py-2 text-sm hover:bg-gray-100"
          >
            Categories <span aria-hidden="true">⌄</span>
          </button>

          {open && (
            <div className="absolute left-0 top-12 z-50 w-44 border border-gray-200 bg-white p-2 shadow-xl">
              {categories.map(([label, href]) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className="block px-3 py-2 text-sm hover:bg-gray-100"
                >
                  {label}
                </Link>
              ))}
            </div>
          )}
        </div>

        <form
          action="/shop"
          onSubmit={submit}
          role="search"
          className="relative hidden flex-1 md:block"
        >
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
            ⌕
          </span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search clothes, brands or products..."
            aria-label="Search clothing"
            className="h-11 w-full rounded-full border border-gray-200 bg-gray-50 pl-11 pr-5 text-sm outline-none focus:border-blue-400"
          />
          <button type="submit" className="sr-only">Search</button>
        </form>

        <nav className="hidden items-center gap-4 lg:flex" aria-label="Customer navigation">
          <Link href="/shop" className="text-sm hover:text-blue-600">Shop</Link>
          <Link href="/deals" className="text-sm hover:text-blue-600">Deals</Link>
          <Link href="/ai-lab" className="rounded-md bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700">
            AI Assistant
          </Link>
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
          <Link
            href="/wishlist"
            aria-label="Wishlist"
            title="Wishlist"
            className="relative flex h-10 w-10 items-center justify-center rounded-full text-xl hover:bg-gray-100"
          >
            ♡
            {wishlist > 0 && (
              <span className="absolute right-0 top-0 min-w-4 rounded-full bg-blue-700 px-1 text-center text-[10px] text-white">
                {wishlist}
              </span>
            )}
          </Link>

          <Link
            href="/cart"
            aria-label="Cart"
            title="Cart"
            className="relative flex h-10 w-10 items-center justify-center rounded-full text-xl hover:bg-gray-100"
          >
            🛒
            {cart > 0 && (
              <span className="absolute right-0 top-0 min-w-4 rounded-full bg-blue-700 px-1 text-center text-[10px] text-white">
                {cart}
              </span>
            )}
          </Link>

          {user ? (
            <div className="relative" ref={profileRef}>
              <button
                type="button"
                onClick={() => setProfileOpen((value) => !value)}
                aria-expanded={profileOpen}
                aria-label="My account"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-blue-200 bg-blue-700 font-semibold text-white shadow-sm hover:bg-blue-800"
              >
                {initial}
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-12 z-[60] w-64 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
                  <div className="border-b border-gray-100 bg-gray-50 px-4 py-4">
                    <p className="font-semibold text-gray-900">Hello, {displayName}</p>
                    <p className="mt-1 truncate text-xs text-gray-500">{user.email}</p>
                  </div>

                  <div className="p-2 text-sm text-gray-700">
                    <Link href="/account?section=profile" onClick={() => setProfileOpen(false)} className="block rounded-lg px-3 py-2.5 hover:bg-gray-100">
                     👤 My Profile
                     </Link>
                     <Link href="/account?section=orders" onClick={() => setProfileOpen(false)} className="block rounded-lg px-3 py-2.5 hover:bg-gray-100">
                     📦 My Orders
                     </Link>
                     <Link href="/account?section=wishlist" onClick={() => setProfileOpen(false)} className="block rounded-lg px-3 py-2.5 hover:bg-gray-100">
                     ♡ Wishlist
                     </Link>
                     <Link href="/account?section=addresses" onClick={() => setProfileOpen(false)} className="block rounded-lg px-3 py-2.5 hover:bg-gray-100">
                     📍 Manage Addresses
                     </Link>
                     <Link href="/account?section=payments" onClick={() => setProfileOpen(false)} className="block rounded-lg px-3 py-2.5 hover:bg-gray-100">
                     💳 Payment Methods
                     </Link>
                     <Link href="/account?section=security" onClick={() => setProfileOpen(false)} className="block rounded-lg px-3 py-2.5 hover:bg-gray-100">
                     ⚙ Login & Security
                     </Link>
                  </div>

                  <div className="border-t border-gray-100 p-2">
                    <button
                      type="button"
                      onClick={logout}
                      className="w-full rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-red-600 hover:bg-red-50"
                    >
                      ↪ Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="rounded-md border border-gray-300 px-3 py-2 text-xs font-semibold tracking-wider text-gray-800 transition hover:border-gray-500 hover:bg-gray-50"
            >
              LOGIN
            </Link>
          )}
        </div>
      </div>

      <form action="/shop" onSubmit={submit} role="search" className="px-4 pb-3 md:hidden">
        <div className="flex gap-2">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search clothing..."
            aria-label="Search clothing"
            className="h-10 min-w-0 flex-1 rounded-full border border-gray-200 px-4 text-sm"
          />
          <button type="submit" className="rounded-full bg-gray-900 px-4 text-sm font-semibold text-white">
            Search
          </button>
        </div>
        <nav className="mt-3 flex gap-4 overflow-x-auto text-sm lg:hidden" aria-label="Categories">
          {categories.map(([label, href]) => (
            <Link key={href} href={href} className="shrink-0 py-1">{label}</Link>
          ))}
          <Link href="/ai-lab" className="shrink-0 py-1">AI stylist</Link>
        </nav>
      </form>
    </header>
  );
}
