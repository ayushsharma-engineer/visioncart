"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useSyncExternalStore, type ReactNode } from "react";
import type { SessionUser } from "@/types/domain";
import { tokenStore } from "@/lib/auth/token-store";
import * as authService from "@/lib/auth/auth-service";
import { useIsClient } from "@/lib/hooks/misc";

export type AuthStatus = "loading" | "authenticated" | "anonymous";

interface AuthValue {
  status: AuthStatus;
  user: SessionUser | null;
  login: (email: string, password: string) => Promise<SessionUser>;
  register: (name: string, email: string, password: string) => Promise<SessionUser>;
  logout: () => Promise<void>;
}

const Ctx = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const session = useSyncExternalStore(tokenStore.subscribe, tokenStore.get, () => null);
  const isClient = useIsClient();
  const verified = useRef(false);

  // Validate a session restored from storage once per page load. The HTTP client refreshes an
  // expired access token and clears the session if the refresh token is no longer valid, so a
  // failure here needs no handling. A network error keeps the user signed in optimistically.
  useEffect(() => {
    if (!session || verified.current) return;
    verified.current = true;
    authService.verifySession().catch(() => {});
  }, [session]);

  const logout = useCallback(() => authService.logout(), []);

  const value = useMemo<AuthValue>(
    () => ({
      status: !isClient ? "loading" : session ? "authenticated" : "anonymous",
      user: session?.user ?? null,
      login: authService.login,
      register: authService.register,
      logout,
    }),
    [isClient, session, logout],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthValue {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used inside <AuthProvider>");
  return c;
}
