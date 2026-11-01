"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getSafeNextPath, verifyCustomerSession } from "@/lib/auth";

type PendingLogin = {
  destination: string;
};

type CustomerAuthContextValue = {
  requestCustomerAccess: (destination: string) => Promise<boolean>;
};

const CustomerAuthContext = createContext<CustomerAuthContextValue | null>(null);

const protectedRoutes = [
  "/shop",
  "/men",
  "/women",
  "/kids",
  "/product",
  "/cart",
  "/wishlist",
  "/checkout",
  "/deals",
  "/ai",
  "/ai-lab",
  "/ask",
];

function matchesRoute(pathname: string, route: string) {
  return pathname === route || pathname.startsWith(`${route}/`);
}

function requiresCustomerSession(pathname: string) {
  return protectedRoutes.some((route) => matchesRoute(pathname, route));
}

function getCurrentDestination() {
  return getSafeNextPath(
    `${window.location.pathname}${window.location.search}${window.location.hash}`,
  ) || "/";
}

export function useCustomerAuth() {
  const context = useContext(CustomerAuthContext);
  if (!context) {
    throw new Error("useCustomerAuth must be used within CustomerRouteGuard");
  }
  return context;
}

export default function CustomerRouteGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const protectedRoute = requiresCustomerSession(pathname);
  const loginPage = pathname === "/login";
  const shouldVerifyRoute = protectedRoute || loginPage;
  const [checkedPath, setCheckedPath] = useState<string | null>(null);
  const [routeAuthenticated, setRouteAuthenticated] = useState(false);
  const [pendingLogin, setPendingLogin] = useState<PendingLogin | null>(null);

  useEffect(() => {
    if (!shouldVerifyRoute) return;

    let active = true;
    verifyCustomerSession().then((authenticated) => {
      if (!active) return;
      setCheckedPath(pathname);
      setRouteAuthenticated(authenticated);

      if (protectedRoute && !authenticated) {
        setPendingLogin({ destination: getCurrentDestination() });
      } else if (loginPage && authenticated) {
        const requested = new URLSearchParams(window.location.search).get("next");
        router.replace(getSafeNextPath(requested) || "/");
      }
    });

    return () => {
      active = false;
    };
  }, [loginPage, pathname, protectedRoute, router, shouldVerifyRoute]);

  async function requestCustomerAccess(destination: string) {
    const safeDestination = getSafeNextPath(destination) || "/";
    const authenticated = await verifyCustomerSession();
    if (authenticated) return true;

    setPendingLogin({ destination: safeDestination });
    return false;
  }

  function navigateWhenAuthenticated(destination: string) {
    void requestCustomerAccess(destination).then((authenticated) => {
      if (authenticated) router.push(destination);
    });
  }

  function handleClickCapture(event: React.MouseEvent<HTMLDivElement>) {
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (!(event.target instanceof Element)) return;

    const anchor = event.target.closest("a[href]");
    if (!anchor || anchor.hasAttribute("download") || anchor.getAttribute("target") === "_blank") return;

    const url = new URL(anchor.getAttribute("href") || "", window.location.href);
    const explicitAuthAction = anchor.hasAttribute("data-require-customer-auth");
    if (url.origin !== window.location.origin || (!explicitAuthAction && !requiresCustomerSession(url.pathname))) return;

    event.preventDefault();
    const destination = anchor.getAttribute("data-auth-destination") || `${url.pathname}${url.search}${url.hash}`;
    navigateWhenAuthenticated(destination);
  }

  function handleSubmitCapture(event: React.FormEvent<HTMLDivElement>) {
    if (!(event.target instanceof HTMLFormElement)) return;

    const form = event.target;
    const url = new URL(form.action, window.location.origin);
    if (url.origin !== window.location.origin || !requiresCustomerSession(url.pathname)) return;

    event.preventDefault();
    event.stopPropagation();

    const query = new URLSearchParams(url.search);
    new FormData(form).forEach((value, key) => {
      if (typeof value === "string") query.set(key, value);
    });
    const search = query.toString();
    navigateWhenAuthenticated(`${url.pathname}${search ? `?${search}` : ""}${url.hash}`);
  }

  function openLogin() {
    if (!pendingLogin) return;
    const destination = getSafeNextPath(pendingLogin.destination) || "/";
    setPendingLogin(null);
    router.push(`/login?next=${encodeURIComponent(destination)}`);
  }

  function cancelLogin() {
    setPendingLogin(null);
  }

  const routeChecking = shouldVerifyRoute && checkedPath !== pathname;
  const directRouteBlocked = protectedRoute && (
    routeChecking || checkedPath !== pathname || !routeAuthenticated
  );

  return (
    <CustomerAuthContext.Provider value={{ requestCustomerAccess }}>
      <div onClickCapture={handleClickCapture} onSubmitCapture={handleSubmitCapture}>
        {directRouteBlocked ? (
          routeChecking || checkedPath !== pathname ? (
            <main className="flex min-h-screen items-center justify-center bg-[#faf9f6] text-sm text-gray-600" role="status" aria-live="polite">
              Checking your session...
            </main>
          ) : (
            <main className="flex min-h-screen items-center justify-center bg-[#faf9f6] px-4 text-center">
              <section className="max-w-md border border-gray-200 bg-white p-7">
                <h1 className="text-xl font-semibold text-[#292923]">Sign in to view this page</h1>
                <p className="mt-2 text-sm leading-6 text-gray-600">Login is required to continue shopping.</p>
                <button type="button" onClick={() => setPendingLogin({ destination: getCurrentDestination() })} className="mt-5 bg-[#30332c] px-5 py-3 text-sm font-semibold text-white hover:bg-[#59654e]">Login</button>
              </section>
            </main>
          )
        ) : routeChecking ? (
          <main className="flex min-h-screen items-center justify-center bg-[#faf9f6] text-sm text-gray-600" role="status" aria-live="polite">
            Checking your session...
          </main>
        ) : (
          children
        )}

        {pendingLogin && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) cancelLogin(); }}>
            <section role="dialog" aria-modal="true" aria-labelledby="login-required-title" className="w-full max-w-md border border-gray-200 bg-[#faf9f6] p-6 shadow-2xl sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#68745b]">VisionCartAI</p>
              <h2 id="login-required-title" className="mt-3 text-2xl font-semibold text-[#292923]">Login required</h2>
              <p className="mt-3 text-sm leading-6 text-[#55564d]">Login required to continue shopping.</p>
              <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button type="button" onClick={cancelLogin} className="border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-800 hover:bg-white">Cancel</button>
                <button type="button" onClick={openLogin} className="bg-[#30332c] px-5 py-3 text-sm font-semibold text-white hover:bg-[#59654e]">Login</button>
              </div>
            </section>
          </div>
        )}
      </div>
    </CustomerAuthContext.Provider>
  );
}
