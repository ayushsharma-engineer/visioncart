"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { verifyCustomerSession } from "@/lib/auth";
import AddressManager from "@/components/account/AddressManager";

const API = (
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"
).replace(/\/$/, "");

const sections = [
  { id: "overview", label: "Account Overview", icon: "▦" },
  { id: "profile", label: "Personal Information", icon: "👤" },
  { id: "orders", label: "Your Orders", icon: "📦" },
  { id: "wishlist", label: "Wishlist", icon: "♡" },
  { id: "addresses", label: "Manage Addresses", icon: "📍" },
  { id: "payments", label: "Payment Methods", icon: "💳" },
  { id: "security", label: "Login & Security", icon: "🔒" },
];

type Profile = {
  user_id?: number | string;
  name?: string;
  email?: string;
  phone?: string | null;
  role?: string;
};

type Session = {
  id: number;
  created_at: string;
  last_used_at?: string | null;
  expires_at: string;
};

type OrderItem = {
  product_id: string;
  product_name: string;
  sku?: string | null;
  image_url?: string | null;
  quantity: number;
  selected_size?: string | null;
  selected_color?: string | null;
  unit_price: number;
  line_total: number;
};

type Order = {
  id: number;
  order_number: string;
  created_at: string;
  status: string;
  subtotal: number;
  shipping_amount: number;
  total_amount: number;
  currency: string;
  payment_status?: string;
  items_count?: number;
  items: OrderItem[];
};

type OrderDetail = Order & {
  updated_at?: string;
  payment?: { provider: string; status: string; payment_id?: string | null } | null;
  delivery?: {
    recipient_name: string;
    phone: string;
    address_line1: string;
    address_line2?: string | null;
    landmark?: string | null;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
};

async function accountRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("visioncart_access_token");
  if (!token) throw new Error("Your session has expired. Please sign in again.");

  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  headers.set("Authorization", `Bearer ${token}`);
  const response = await fetch(`${API}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result?.detail || result?.message || "Request failed. Please try again.");
  }
  return (result?.data ?? result) as T;
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatMoney(value: number, currency = "INR") {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

export default function AccountPage() {
  const router = useRouter();
  const [section, setSection] = useState("overview");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [profileName, setProfileName] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");

  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState("");
  const [orderDetails, setOrderDetails] = useState<OrderDetail | null>(null);
  const [detailsLoading, setDetailsLoading] = useState<number | null>(null);

  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionsError, setSessionsError] = useState("");
  const [sessionMessage, setSessionMessage] = useState("");
  const [revokingSession, setRevokingSession] = useState<number | null>(null);
  const [revokeAllLoading, setRevokeAllLoading] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    const selected = new URLSearchParams(window.location.search).get("section");
    if (sections.some((item) => item.id === selected)) setSection(selected!);
  }, []);

  useEffect(() => {
    let active = true;
    async function loadProfile() {
      try {
        const authenticated = await verifyCustomerSession();
        if (!authenticated) {
          router.replace("/login?next=%2Faccount");
          return;
        }
        const token = localStorage.getItem("visioncart_access_token");
        const response = await fetch(`${API}/profile`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result?.detail || "Unable to load account profile");
        if (active) {
          const data = result.data as Profile;
          setProfile(data);
          setProfileName(data.name || "");
          setProfilePhone(data.phone || "");
        }
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadProfile();
    return () => { active = false; };
  }, [router]);

  useEffect(() => {
    if (section !== "orders") return;
    let active = true;
    setOrdersLoading(true);
    setOrdersError("");
    accountRequest<Order[]>("/api/orders/my")
      .then((data) => { if (active) setOrders(Array.isArray(data) ? data : []); })
      .catch((err) => { if (active) setOrdersError(err instanceof Error ? err.message : "Unable to load orders."); })
      .finally(() => { if (active) setOrdersLoading(false); });
    return () => { active = false; };
  }, [section]);

  useEffect(() => {
    if (section !== "security") return;
    let active = true;
    setSessionsLoading(true);
    setSessionsError("");
    accountRequest<Session[]>("/api/account/sessions")
      .then((data) => { if (active) setSessions(Array.isArray(data) ? data : []); })
      .catch((err) => { if (active) setSessionsError(err instanceof Error ? err.message : "Unable to load sessions."); })
      .finally(() => { if (active) setSessionsLoading(false); });
    return () => { active = false; };
  }, [section]);

  function changeSection(id: string) {
    setSection(id);
    window.history.replaceState(null, "", `/account?section=${id}`);
  }

  async function logout() {
    const refreshToken = localStorage.getItem("visioncart_refresh_token");
    try {
      if (refreshToken) {
        await fetch(`${API}/api/auth/logout`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });
      }
    } catch {
      // Clear local credentials even when the server is unavailable.
    } finally {
      localStorage.removeItem("visioncart_access_token");
      localStorage.removeItem("visioncart_refresh_token");
      localStorage.removeItem("visioncart_user");
      window.dispatchEvent(new Event("visioncart-auth"));
      router.replace("/");
    }
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setProfileSaving(true);
    setProfileMessage("");
    try {
      const payload: { name: string; phone?: string } = { name: profileName.trim() };
      if (profilePhone.trim()) payload.phone = profilePhone.trim();
      const data = await accountRequest<Profile & { message?: string }>("/api/account/profile", {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      setProfile((current) => ({ ...current, ...data }));
      setProfileName(data.name || profileName.trim());
      setProfilePhone(data.phone || "");
      setProfileMessage("Profile updated successfully.");
    } catch (err) {
      setProfileMessage(err instanceof Error ? err.message : "Unable to update profile.");
    } finally {
      setProfileSaving(false);
    }
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordMessage("");
    setPasswordError("");
    if (newPassword !== confirmPassword) {
      setPasswordError("New password and confirmation do not match.");
      return;
    }
    setPasswordLoading(true);
    try {
      const data = await accountRequest<{ message?: string }>("/api/account/change-password", {
        method: "POST",
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
      });
      setPasswordMessage(data.message || "Password changed. Please sign in again.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      localStorage.removeItem("visioncart_access_token");
      localStorage.removeItem("visioncart_refresh_token");
      localStorage.removeItem("visioncart_user");
      window.dispatchEvent(new Event("visioncart-auth"));
      window.setTimeout(() => router.replace("/login"), 1200);
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : "Unable to change password.");
    } finally {
      setPasswordLoading(false);
    }
  }

  async function revokeSession(sessionId: number) {
    setRevokingSession(sessionId);
    setSessionMessage("");
    try {
      const data = await accountRequest<{ message?: string }>(`/api/account/sessions/${sessionId}`, {
        method: "DELETE",
      });
      setSessions((current) => current.filter((session) => session.id !== sessionId));
      setSessionMessage(data.message || "Session revoked.");
    } catch (err) {
      setSessionsError(err instanceof Error ? err.message : "Unable to revoke session.");
    } finally {
      setRevokingSession(null);
    }
  }

  async function revokeAllSessions() {
    if (!window.confirm("This will sign out all devices. Continue?")) return;
    setRevokeAllLoading(true);
    setSessionMessage("");
    try {
      const data = await accountRequest<{ message?: string }>("/api/account/sessions/revoke-all", {
        method: "POST",
      });
      setSessions([]);
      setSessionMessage(data.message || "All sessions revoked. Please sign in again.");
      localStorage.removeItem("visioncart_access_token");
      localStorage.removeItem("visioncart_refresh_token");
      localStorage.removeItem("visioncart_user");
      window.dispatchEvent(new Event("visioncart-auth"));
      window.setTimeout(() => router.replace("/login"), 1200);
    } catch (err) {
      setSessionsError(err instanceof Error ? err.message : "Unable to revoke sessions.");
    } finally {
      setRevokeAllLoading(false);
    }
  }

  async function loadOrderDetails(orderId: number) {
    setDetailsLoading(orderId);
    setOrdersError("");
    try {
      const data = await accountRequest<OrderDetail>(`/api/orders/${orderId}`);
      setOrderDetails(data);
    } catch (err) {
      setOrdersError(err instanceof Error ? err.message : "Unable to load order details.");
    } finally {
      setDetailsLoading(null);
    }
  }

  const activeSection = sections.find((item) => item.id === section);
  const initial = (profile?.name || profile?.email || "U").charAt(0).toUpperCase();

  if (loading) {
    return <main className="flex min-h-[65vh] items-center justify-center text-gray-500">Loading your account...</main>;
  }

  if (error || !profile) {
    return (
      <main className="flex min-h-[65vh] flex-col items-center justify-center gap-3 px-4">
        <p className="text-red-600">{error || "Unable to load your account."}</p>
        <Link href="/login" className="rounded-lg bg-gray-900 px-5 py-3 text-white">Sign in again</Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f6f7] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-7">
          <p className="text-sm text-gray-500"><Link href="/" className="hover:text-blue-700">Home</Link>{" / "}My Account</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">My Account</h1>
          <p className="mt-1 text-sm text-gray-500">Manage your profile, orders and shopping preferences.</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[270px_1fr]">
          <aside className="h-fit overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center gap-3 border-b border-gray-100 p-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-700 text-xl font-bold text-white">{initial}</div>
              <div className="min-w-0">
                <p className="truncate font-semibold text-gray-900">{profile.name}</p>
                <p className="truncate text-xs text-gray-500">{profile.email}</p>
              </div>
            </div>
            <nav className="p-3" aria-label="Account sections">
              <p className="px-3 pb-2 pt-1 text-xs font-bold uppercase tracking-wider text-gray-400">Your Account</p>
              {sections.map((item) => (
                <button key={item.id} type="button" onClick={() => changeSection(item.id)}
                  className={`mb-1 flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm transition ${section === item.id ? "bg-blue-50 font-semibold text-blue-800" : "text-gray-700 hover:bg-gray-50"}`}>
                  <span className="text-lg">{item.icon}</span>{item.label}
                </button>
              ))}
              <div className="my-3 border-t border-gray-100" />
              <button type="button" onClick={logout} className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-semibold text-red-600 hover:bg-red-50">
                <span className="text-lg">↪</span>Logout
              </button>
            </nav>
          </aside>

          <section className="min-h-[480px] rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-8">
            <h2 className="text-2xl font-bold text-gray-900">{activeSection?.label}</h2>

            {section === "overview" && (
              <div className="mt-6">
                <div className="rounded-xl bg-[#263629] p-6 text-white">
                  <p className="text-sm text-white/70">Welcome back</p>
                  <h3 className="mt-2 text-2xl font-bold">{profile.name}</h3>
                  <p className="mt-2 text-sm text-white/75">Your personal shopping space at VisionCartAI.</p>
                </div>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {[
                    ["📦", "Your Orders", "View your purchase history", "orders"],
                    ["👤", "Personal Information", "Manage your profile", "profile"],
                    ["♡", "Wishlist", "View your saved products", "wishlist"],
                    ["📍", "Addresses", "Manage delivery addresses", "addresses"],
                  ].map(([icon, title, description, id]) => (
                    <button key={id} type="button" onClick={() => changeSection(id)}
                      className="rounded-xl border border-gray-200 p-5 text-left transition hover:border-blue-300 hover:bg-blue-50/40">
                      <span className="text-2xl">{icon}</span>
                      <p className="mt-3 font-semibold text-gray-900">{title}</p>
                      <p className="mt-1 text-sm text-gray-500">{description}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {section === "profile" && (
              <form onSubmit={saveProfile} className="mt-6 max-w-xl space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-600" htmlFor="profile-name">Full Name</label>
                  <input id="profile-name" required minLength={2} maxLength={100} value={profileName} onChange={(e) => setProfileName(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-gray-800 outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-600" htmlFor="profile-email">Email Address</label>
                  <input id="profile-email" readOnly value={profile.email || ""}
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-gray-500" />
                  <p className="mt-1 text-xs text-gray-500">Email address cannot be changed here.</p>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-600" htmlFor="profile-phone">Mobile Number</label>
                  <input id="profile-phone" type="tel" minLength={10} maxLength={13} pattern="(?:\+91)?[6-9][0-9]{9}" value={profilePhone} onChange={(e) => setProfilePhone(e.target.value)}
                    placeholder="10-digit mobile number"
                    className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-gray-800 outline-none focus:border-blue-500" />
                  <p className="mt-1 text-xs text-gray-500">Enter a valid 10-digit Indian mobile number. +91 is optional.</p>
                </div>
                {profileMessage && <p className={`text-sm ${profileMessage.includes("successfully") ? "text-green-700" : "text-red-600"}`}>{profileMessage}</p>}
                <button disabled={profileSaving} className="rounded-lg bg-blue-700 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60">
                  {profileSaving ? "Saving..." : "Save Changes"}
                </button>
              </form>
            )}

            {section === "orders" && (
              <div className="mt-6 space-y-4">
                {ordersLoading ? <p className="text-sm text-gray-500">Loading your orders...</p> :
                  ordersError ? <p className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{ordersError}</p> :
                  orders.length === 0 ? <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-10 text-center">
                    <p className="text-3xl">📦</p><p className="mt-3 font-semibold text-gray-900">No orders yet</p>
                    <p className="mt-1 text-sm text-gray-500">Your purchases will appear here after checkout.</p>
                    <Link href="/shop" className="mt-4 inline-flex rounded-lg bg-gray-900 px-5 py-3 text-sm font-semibold text-white">Start shopping</Link>
                  </div> :
                  orders.map((order) => (
                    <article key={order.id} className="rounded-xl border border-gray-200 p-4 sm:p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div><p className="font-semibold text-gray-900">{order.order_number}</p><p className="mt-1 text-xs text-gray-500">{formatDate(order.created_at)}</p></div>
                        <div className="text-right"><p className="font-semibold text-gray-900">{formatMoney(order.total_amount, order.currency)}</p><p className="mt-1 text-xs capitalize text-gray-500">Payment: {order.payment_status || "Unknown"}</p></div>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-3">
                        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium capitalize text-blue-800">{order.status.replaceAll("_", " ")}</span>
                        <span className="text-xs text-gray-500">{order.items_count ?? order.items?.reduce((n, item) => n + item.quantity, 0)} item(s)</span>
                        <button type="button" onClick={() => void loadOrderDetails(order.id)} disabled={detailsLoading === order.id}
                          className="text-sm font-semibold text-blue-700 hover:underline disabled:opacity-50">{detailsLoading === order.id ? "Loading..." : "View details"}</button>
                      </div>
                    </article>
                  ))}
                {orderDetails && (
                  <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-5">
                    <div className="flex items-center justify-between gap-3"><h3 className="font-bold text-gray-900">Order details · {orderDetails.order_number}</h3>
                      <button type="button" onClick={() => setOrderDetails(null)} className="text-sm text-blue-700 hover:underline">Close</button></div>
                    <div className="mt-4 space-y-3">
                      {orderDetails.items.map((item, index) => (
                        <div key={`${item.product_id}-${index}`} className="flex items-center justify-between gap-3 border-b border-gray-200 pb-3 text-sm">
                          <div><p className="font-medium text-gray-900">{item.product_name}</p><p className="text-xs text-gray-500">Qty {item.quantity}{item.selected_size ? ` · Size ${item.selected_size}` : ""}{item.selected_color ? ` · ${item.selected_color}` : ""}</p></div>
                          <p className="font-semibold">{formatMoney(item.line_total, orderDetails.currency)}</p>
                        </div>
                      ))}
                    </div>
                    {orderDetails.delivery && <div className="mt-4 text-sm text-gray-600"><p className="font-semibold text-gray-900">Delivery address</p><p>{orderDetails.delivery.recipient_name} · {orderDetails.delivery.phone}</p><p>{orderDetails.delivery.address_line1}{orderDetails.delivery.address_line2 ? `, ${orderDetails.delivery.address_line2}` : ""}, {orderDetails.delivery.city}, {orderDetails.delivery.state} - {orderDetails.delivery.postal_code}</p></div>}
                    <p className="mt-3 text-xs text-gray-500">Order status: {orderDetails.status.replaceAll("_", " ")} · Payment: {orderDetails.payment?.status || "Unavailable"}</p>
                  </div>
                )}
              </div>
            )}

            {section === "security" && (
              <div className="mt-6 max-w-2xl space-y-8">
                <form onSubmit={changePassword} className="space-y-4 rounded-xl border border-gray-200 p-5">
                  <div><h3 className="font-semibold text-gray-900">Change Password</h3><p className="mt-1 text-sm text-gray-500">Changing your password signs out all devices.</p></div>
                  <div><label htmlFor="current-password" className="mb-1 block text-sm font-medium text-gray-600">Current password</label>
                    <input id="current-password" type="password" required minLength={8} maxLength={128} autoComplete="current-password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full rounded-lg border border-gray-200 px-4 py-3" /></div>
                  <div><label htmlFor="new-password" className="mb-1 block text-sm font-medium text-gray-600">New password</label>
                    <input id="new-password" type="password" required minLength={8} maxLength={128} autoComplete="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full rounded-lg border border-gray-200 px-4 py-3" /></div>
                  <div><label htmlFor="confirm-password" className="mb-1 block text-sm font-medium text-gray-600">Confirm new password</label>
                    <input id="confirm-password" type="password" required minLength={8} maxLength={128} autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full rounded-lg border border-gray-200 px-4 py-3" /></div>
                  {passwordError && <p className="text-sm text-red-600">{passwordError}</p>}
                  {passwordMessage && <p className="text-sm text-green-700">{passwordMessage}</p>}
                  <button disabled={passwordLoading} className="rounded-lg bg-blue-700 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">{passwordLoading ? "Updating..." : "Update Password"}</button>
                </form>

                <div className="rounded-xl border border-gray-200 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-semibold text-gray-900">Active Sessions</h3><p className="mt-1 text-sm text-gray-500">Manage devices currently signed in to your account.</p></div>
                    <button type="button" onClick={() => void revokeAllSessions()} disabled={revokeAllLoading || sessions.length === 0} className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50">{revokeAllLoading ? "Signing out..." : "Sign out all devices"}</button></div>
                  {sessionsLoading ? <p className="mt-4 text-sm text-gray-500">Loading sessions...</p> :
                    sessionsError ? <p className="mt-4 text-sm text-red-600">{sessionsError}</p> :
                    sessions.length === 0 ? <p className="mt-4 text-sm text-gray-500">No active sessions found.</p> :
                    <div className="mt-4 divide-y divide-gray-100">{sessions.map((session) => (
                      <div key={session.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                        <div><p className="text-sm font-medium text-gray-900">Session #{session.id}</p><p className="mt-1 text-xs text-gray-500">Created {formatDate(session.created_at)} · Expires {formatDate(session.expires_at)}</p></div>
                        <button type="button" onClick={() => void revokeSession(session.id)} disabled={revokingSession === session.id} className="text-sm font-semibold text-red-700 hover:underline disabled:opacity-50">{revokingSession === session.id ? "Revoking..." : "Revoke"}</button>
                      </div>
                    ))}</div>}
                  {sessionMessage && <p className="mt-3 text-sm text-green-700">{sessionMessage}</p>}
                </div>
              </div>
            )}

            {section === "wishlist" && (
              <div className="mt-6 rounded-xl border border-gray-200 p-6">
                <p className="text-gray-600">Your saved products are available in your wishlist.</p>
                <Link href="/wishlist" className="mt-4 inline-flex rounded-lg bg-gray-900 px-5 py-3 text-sm font-semibold text-white hover:bg-gray-700">Open Wishlist</Link>
              </div>
            )}

            {section === "addresses" && <div className="mt-6"><AddressManager /></div>}

            {section === "payments" && (
              <div className="mt-6 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
                <p className="text-3xl">💳</p><h3 className="mt-3 font-semibold text-gray-900">Payment Methods</h3>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">Saved cards are managed securely by the payment provider. VisionCartAI does not store card numbers or CVV details.</p>
                <p className="mt-3 text-xs font-medium text-amber-700">Saved payment method management is not configured yet.</p>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
