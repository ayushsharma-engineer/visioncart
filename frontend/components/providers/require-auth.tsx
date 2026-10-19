"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "./auth";
import { Skeleton } from "../ui/skeleton";

/** Client-side route guard. Real authorisation is enforced by the API; this only routes people. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "anonymous") router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [status, router, pathname]);

  if (status !== "authenticated") {
    return <div className="mx-auto max-w-3xl space-y-4 px-4 py-16" role="status" aria-label="Checking your session"><Skeleton className="h-8 w-1/3" /><Skeleton className="h-40 w-full" /></div>;
  }
  return <>{children}</>;
}
