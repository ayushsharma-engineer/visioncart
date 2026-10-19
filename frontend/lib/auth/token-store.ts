import type { SessionUser } from "@/types/domain";

/**
 * Session persistence.
 *
 * The backend returns tokens in the JSON body (no cookies), so they are kept in
 * localStorage. Trade-off: readable by any script on the page (XSS). The hardening
 * path is httpOnly cookies set by a Next route handler acting as a BFF — see INTEGRATION.md.
 */

export interface StoredSession {
  accessToken: string;
  refreshToken: string;
  user: SessionUser;
}

const KEY = "vc.session.v1";

let cache: StoredSession | null | undefined; // undefined = not read yet
const listeners = new Set<() => void>();

function isValid(x: unknown): x is StoredSession {
  if (!x || typeof x !== "object") return false;
  const s = x as Partial<StoredSession>;
  return (
    typeof s.accessToken === "string" &&
    typeof s.refreshToken === "string" &&
    !!s.user &&
    typeof s.user.id === "number" &&
    typeof s.user.email === "string"
  );
}

function read(): StoredSession | null {
  if (typeof window === "undefined") return null;
  if (cache !== undefined) return cache;
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    cache = isValid(parsed) ? parsed : null;
  } catch {
    cache = null;
  }
  return cache;
}

function emit() {
  listeners.forEach((fn) => fn());
}

function persist(next: StoredSession | null) {
  cache = next;
  try {
    if (next) window.localStorage.setItem(KEY, JSON.stringify(next));
    else window.localStorage.removeItem(KEY);
  } catch {
    /* storage full / blocked: keep in-memory session */
  }
  emit();
}

let storageBound = false;
function bindStorageEvents() {
  if (storageBound || typeof window === "undefined") return;
  storageBound = true;
  window.addEventListener("storage", (e) => {
    if (e.key === KEY || e.key === null) {
      cache = undefined; // sign in/out in another tab
      emit();
    }
  });
}

export const tokenStore = {
  get: read,
  set: (s: StoredSession) => persist(s),
  /** Called after a refresh: the backend rotates BOTH tokens. */
  setTokens(accessToken: string, refreshToken: string) {
    const cur = read();
    if (cur) persist({ ...cur, accessToken, refreshToken });
  },
  clear: () => persist(null),
  subscribe(fn: () => void) {
    bindStorageEvents();
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
};
