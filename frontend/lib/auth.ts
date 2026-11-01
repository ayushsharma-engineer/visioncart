const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"
).replace(/\/$/, "");

const ACCESS_TOKEN_KEY = "visioncart_access_token";
const REFRESH_TOKEN_KEY = "visioncart_refresh_token";
const USER_KEY = "visioncart_user";

export function getSafeNextPath(candidate: string | null | undefined) {
  if (!candidate || !candidate.startsWith("/") || candidate.startsWith("//") || candidate.includes("\\")) return null;

  try {
    const origin = typeof window === "undefined" ? "http://localhost" : window.location.origin;
    const destination = new URL(candidate, origin);

    if (destination.origin !== origin || ["/login", "/register"].includes(destination.pathname)) return null;

    return `${destination.pathname}${destination.search}${destination.hash}`;
  } catch {
    return null;
  }
}

type ProfileResponse = { data?: { role?: string } };
type RefreshResponse = { data?: { access_token?: string; refresh_token?: string } };

let verificationInFlight: Promise<boolean> | null = null;
let refreshInFlight: Promise<boolean> | null = null;

function clearCustomerSession() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  window.dispatchEvent(new Event("visioncart-auth"));
}

async function checkAccessToken(token: string): Promise<boolean | null> {
  try {
    const response = await fetch(`${API_BASE}/profile`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    if (response.status === 401) return null;
    if (!response.ok) return null;

    const result = await response.json() as ProfileResponse;
    return result.data?.role === "customer";
  } catch {
    return null;
  }
}

async function refreshSession(token: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: token }),
      cache: "no-store",
    });

    if (response.status === 401) {
      clearCustomerSession();
      return false;
    }

    if (!response.ok) return false;

    const result = await response.json() as RefreshResponse;
    const access = result.data?.access_token;
    const refresh = result.data?.refresh_token;

    if (!access || !refresh) return false;

    localStorage.setItem(ACCESS_TOKEN_KEY, access);
    localStorage.setItem(REFRESH_TOKEN_KEY, refresh);

    const valid = await checkAccessToken(access);
    return valid === true;
  } catch {
    return false;
  }
}

export function verifyCustomerSession(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (verificationInFlight) return verificationInFlight;

  const task = (async () => {
    let user: { role?: string } | null = null;

    try {
      user = JSON.parse(localStorage.getItem(USER_KEY) || "null");
    } catch {
      return false;
    }

    if (user?.role !== "customer") return false;

    const access = localStorage.getItem(ACCESS_TOKEN_KEY);
    const refresh = localStorage.getItem(REFRESH_TOKEN_KEY);

    if (!access && !refresh) return false;

    if (access) {
      const valid = await checkAccessToken(access);
      if (valid === true) return true;
      if (valid === false) return false;
    }

    if (!refresh) {
      clearCustomerSession();
      return false;
    }

    if (!refreshInFlight) {
      refreshInFlight = refreshSession(refresh).finally(() => {
        refreshInFlight = null;
      });
    }

    return refreshInFlight;
  })();

  verificationInFlight = task;

  return task.finally(() => {
    if (verificationInFlight === task) verificationInFlight = null;
  });
}
