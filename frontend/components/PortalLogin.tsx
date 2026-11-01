
"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSafeNextPath } from "@/lib/auth";

type PortalType = "customer" | "seller" | "delivery" | "admin";

type PortalLoginProps = {
  portal: PortalType;
};

const portalConfig = {
  customer: {
    title: "Welcome back",
    subtitle: "Discover styles that feel like you.",
    button: "Sign in",
    endpoint: "/api/auth/login",
    dashboard: "/",
    registerText: "New to VisionCart?",
    registerLabel: "Create account",
    registerHref: "/register",
    eyebrow: "YOUR STYLE JOURNEY",
    image:
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1400&q=85",
    imageAlt: "Fashion shopping and personal style inspiration",
    imageTag: "STYLE MEETS INTELLIGENCE",
    imageHeading: "Good style. Smarter choices.",
    imageDescription:
      "Find pieces that fit your style, your occasion and your budget.",
  },
  seller: {
    title: "Welcome, seller",
    subtitle: "Your store deserves to stand out.",
    button: "Sign in to your store",
    endpoint: "/api/auth/seller/login",
    dashboard: "/seller/dashboard",
    registerText: "Ready to start selling?",
    registerLabel: "Register your store",
    registerHref: "/seller/register",
    eyebrow: "YOUR BUSINESS, YOUR GROWTH",
    image:
      "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1400&q=85",
    imageAlt: "Modern clothing boutique and retail store",
    imageTag: "BUILT FOR SELLERS",
    imageHeading: "Make your store stand out.",
    imageDescription:
      "Manage your fashion business and bring your products to more customers.",
  },
  delivery: {
    title: "Welcome back",
    subtitle: "Your next delivery starts here.",
    button: "Sign in",
    endpoint: "/api/auth/delivery/login",
    dashboard: "/delivery/dashboard",
    registerText: "Want to join our network?",
    registerLabel: "Register now",
    registerHref: "/delivery/register",
    eyebrow: "EVERY DELIVERY MATTERS",
   image:
   "https://images.unsplash.com/photo-1526367790999-0150786686a2?auto=format&fit=crop&w=1400&q=85",
   imageAlt: "Delivery rider riding a motorcycle with a delivery bag",


    imageTag: "DELIVER WITH CONFIDENCE",
    imageHeading: "Every order moves us forward.",
    imageDescription:
      "Stay connected with your delivery work and help every order reach its destination.",
  },
  admin: {
    title: "Admin portal",
    subtitle: "Authorized access only.",
    button: "Admin sign in",
    endpoint: "",
    dashboard: "/admin/dashboard",
    registerText: "",
    registerLabel: "",
    registerHref: "",
    eyebrow: "VISIONCARTAI MANAGEMENT",
    image:
      "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1400&q=85",
    imageAlt: "Professional office workspace",
    imageTag: "MANAGE WITH CLARITY",
    imageHeading: "One platform. Clear oversight.",
    imageDescription:
      "Administrative access will be enabled after secure admin authentication is implemented.",
  },
};

export default function PortalLogin({ portal }: PortalLoginProps) {
  const router = useRouter();
  const config = portalConfig[portal];

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");

    // Admin authentication is not implemented in the backend yet.
    if (portal === "admin") {
      setMessage("Admin authentication is not configured yet.");
      return;
    }

    setLoading(true);

    try {
      const apiBase = (
        process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"
      ).replace(/\/$/, "");

      const response = await fetch(`${apiBase}${config.endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        const detail = result?.detail;
        setMessage(
          typeof detail === "string"
            ? detail
            : typeof detail?.message === "string"
              ? detail.message
              : typeof result?.error?.message === "string"
                ? result.error.message
                : "Login failed. Check your credentials or account status."
        );
        return;
      }

      const data = result?.data;
      const expectedRole = portal === "customer" ? "customer" : portal;

      if (
        !data?.access_token ||
        !data?.refresh_token ||
        data?.user?.role !== expectedRole
      ) {
        setMessage("Unable to validate the login response.");
        return;
      }

      // Temporary client-side storage; replace with secure cookie sessions
      // before production deployment.
      localStorage.setItem("visioncart_access_token", data.access_token);
      localStorage.setItem("visioncart_refresh_token", data.refresh_token);
      localStorage.setItem("visioncart_user", JSON.stringify(data.user));
      window.dispatchEvent(new Event("visioncart-auth"));

      setPassword("");
      const requestedDestination = portal === "customer"
        ? getSafeNextPath(new URLSearchParams(window.location.search).get("next"))
        : null;
      router.replace(requestedDestination || config.dashboard);
    } catch {
      setMessage("Unable to connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] p-3 sm:p-6 lg:p-10">
      <div className="mx-auto grid min-h-[calc(100vh-24px)] max-w-7xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_20px_70px_-35px_rgba(15,23,42,0.25)] sm:min-h-[calc(100vh-48px)] lg:grid-cols-2">
        {/* Login form */}
        <section className="flex items-center justify-center px-6 py-10 sm:px-12 lg:px-16">
          <div className="w-full max-w-md">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-700 text-lg font-bold text-white shadow-sm">
                V
              </span>
              <span className="text-xl font-bold tracking-tight text-slate-900">
                VisionCart<span className="text-blue-700">AI</span>
              </span>
            </Link>

            <div className="mt-10 sm:mt-14">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-700">
                {config.eyebrow}
              </p>

              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                {config.title}
              </h1>

              <p className="mt-3 text-base leading-7 text-slate-500">
                {config.subtitle}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="username"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
                />
              </div>

              {portal === "customer" ? (
                <div className="flex justify-end">
                  <Link href="/forgot-password" className="text-sm font-medium text-blue-700 hover:text-blue-900 hover:underline">
                    Forgot password?
                  </Link>
                </div>
              ) : portal !== "admin" ? (
                <p className="text-right text-xs text-slate-500">Password reset is not available yet.</p>
              ) : null}

              {message && (
                <p
                  role="alert"
                  className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                  {message}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-blue-700 px-5 py-3.5 font-semibold text-white transition hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-700/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Signing in..." : config.button}
              </button>
            </form>

            {config.registerText && (
              <p className="mt-6 text-center text-sm text-slate-500">
                {config.registerText}{" "}
                <Link
                  href={config.registerHref}
                  className="font-semibold text-blue-700 hover:text-blue-900 hover:underline"
                >
                  {config.registerLabel}
                </Link>
              </p>
            )}

            <p className="mt-10 text-center text-xs text-slate-400">
              © {new Date().getFullYear()} VisionCartAI. All rights reserved.
            </p>
          </div>
        </section>

        {/* Different image and message for each portal */}
        <section className="relative hidden min-h-[650px] overflow-hidden bg-slate-200 lg:block">
          <img
            key={config.image}
            src={config.image}
            alt={config.imageAlt}
            className="absolute inset-0 h-full w-full object-cover"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/15 to-slate-950/10" />

          <div className="absolute left-10 top-10 rounded-full border border-white/40 bg-white/20 px-4 py-2 text-xs font-semibold tracking-wide text-white backdrop-blur-md">
            {config.imageTag}
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-10 xl:p-14">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-200">
              {portal === "customer"
                ? "DISCOVER YOUR NEXT LOOK"
                : portal === "seller"
                  ? "GROW YOUR BUSINESS"
                  : portal === "delivery"
                    ? "POWERING EVERY DELIVERY"
                    : "MANAGEMENT WORKSPACE"}
            </p>

            <h2 className="mt-4 max-w-lg text-4xl font-semibold leading-tight text-white xl:text-5xl">
              {config.imageHeading}
            </h2>

            <p className="mt-4 max-w-md text-base leading-7 text-white/90">
              {config.imageDescription}
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
