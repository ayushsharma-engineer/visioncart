import { ApiError, normalizeErrorBody } from "../core/errors";
import { tokenStore } from "../auth/token-store";

/**
 * The only module that talks to the backend.
 *
 * - Browser: same-origin /backend/* (proxied by next.config.ts; the API has no CORS).
 * - Server:  BACKEND_URL directly.
 * - Unwraps the { success: true, data } envelope used by APIResponse.
 * - On 401 for an authenticated call: refresh ONCE (single-flight), retry once, else sign out.
 */

function baseUrl(): string {
  if (typeof window === "undefined") {
    return (process.env.BACKEND_URL ?? "http://localhost:8000").replace(/\/+$/, "");
  }
  return "/backend";
}

type Json = unknown;

function unwrap(body: Json): Json {
  if (body && typeof body === "object" && "success" in body && (body as { success: unknown }).success === true && "data" in body) {
    return (body as { data: Json }).data;
  }
  return body;
}

async function parseBody(res: Response): Promise<Json> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

let inflightRefresh: Promise<boolean> | null = null;

function refreshTokens(): Promise<boolean> {
  const current = tokenStore.get();
  if (!current?.refreshToken) return Promise.resolve(false);
  if (inflightRefresh) return inflightRefresh;

  const attempt = (async () => {
    try {
      const res = await fetch(`${baseUrl()}/api/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ refresh_token: current.refreshToken }),
        cache: "no-store",
      });
      if (!res.ok) {
        // Refresh tokens rotate, so a second tab refreshing with the same token gets rejected. If the
        // stored token changed while we were waiting, another tab already refreshed: just retry.
        return tokenStore.get()?.refreshToken !== current.refreshToken && !!tokenStore.get();
      }
      const data = unwrap(await parseBody(res)) as { access_token?: unknown; refresh_token?: unknown } | null;
      if (typeof data?.access_token !== "string" || typeof data?.refresh_token !== "string") return false;
      tokenStore.setTokens(data.access_token, data.refresh_token);
      return true;
    } catch {
      return false;
    }
  })().finally(() => {
    inflightRefresh = null;
  });

  inflightRefresh = attempt;
  return attempt;
}

export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  /** Send the bearer token and auto-refresh on 401. Default true. */
  auth?: boolean;
  signal?: AbortSignal;
}

export async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, auth = true, signal } = opts;

  const send = async (): Promise<Response> => {
    const headers: Record<string, string> = { Accept: "application/json" };
    if (body !== undefined) headers["Content-Type"] = "application/json";
    const token = auth ? tokenStore.get()?.accessToken : undefined;
    if (token) headers.Authorization = `Bearer ${token}`;
    try {
      return await fetch(`${baseUrl()}${path}`, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal,
        cache: "no-store",
      });
    } catch (e) {
      if (signal?.aborted) throw e;
      throw new ApiError(
        0,
        "NETWORK_ERROR",
        "We can't reach the VisionCart server right now. Please check your connection and try again.",
      );
    }
  };

  let res = await send();

  if (res.status === 401 && auth && tokenStore.get()?.refreshToken) {
    if (await refreshTokens()) {
      res = await send();
    } else {
      tokenStore.clear(); // refresh token revoked/expired: session is over
    }
  }

  const parsed = await parseBody(res);
  if (!res.ok) throw normalizeErrorBody(res.status, parsed);
  return unwrap(parsed) as T;
}
