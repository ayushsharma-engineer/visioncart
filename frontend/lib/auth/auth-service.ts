import { request } from "../http/client";
import { tokenStore } from "./token-store";
import type { SessionUser } from "@/types/domain";

/**
 * LIVE: every call here hits an endpoint that exists in backend/app today.
 *
 *   POST /api/auth/login    { email, password }  -> { access_token, refresh_token, user_id, name, email }
 *   POST /users             { name, email, password }  (registration lives here, NOT under /api/auth)
 *   POST /api/auth/logout   { refresh_token }
 *   GET  /profile           -> { user_id }   (used to validate a restored session)
 */

interface LoginResponse {
  message: string;
  access_token: string;
  refresh_token: string;
  user_id: number;
  name: string;
  email: string;
}

export async function login(email: string, password: string): Promise<SessionUser> {
  const data = await request<LoginResponse>("/api/auth/login", {
    method: "POST",
    body: { email: email.trim(), password },
    auth: false,
  });
  const user: SessionUser = { id: data.user_id, name: data.name, email: data.email };
  tokenStore.set({ accessToken: data.access_token, refreshToken: data.refresh_token, user });
  return user;
}

export async function register(name: string, email: string, password: string): Promise<SessionUser> {
  await request<{ id: number; name: string; email: string }>("/users", {
    method: "POST",
    body: { name: name.trim(), email: email.trim(), password },
    auth: false,
  });
  // POST /users returns no tokens, so sign in straight after.
  return login(email, password);
}

export async function logout(): Promise<void> {
  const session = tokenStore.get();
  try {
    if (session?.refreshToken) {
      await request("/api/auth/logout", {
        method: "POST",
        body: { refresh_token: session.refreshToken },
        auth: false,
      });
    }
  } catch {
    /* even if the server call fails, the local session must end */
  } finally {
    tokenStore.clear();
  }
}

/** Validates the stored access token (refreshing it if needed). Throws ApiError on failure. */
export async function verifySession(signal?: AbortSignal): Promise<{ user_id: number }> {
  return request<{ user_id: number }>("/profile", { signal });
}
