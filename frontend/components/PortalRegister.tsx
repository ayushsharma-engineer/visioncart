
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

function apiErrorMessage(result: unknown, fallback: string) {
  if (!result || typeof result !== "object") return fallback;
  const body = result as { detail?: unknown; error?: { message?: unknown } };
  if (typeof body.detail === "string") return body.detail;
  if (body.detail && typeof body.detail === "object" && "message" in body.detail && typeof body.detail.message === "string") {
    return body.detail.message;
  }
  if (typeof body.error?.message === "string") return body.error.message;
  return fallback;
}

function formatDuration(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

type RegisterPortal = "customer" | "seller" | "delivery";

const config = {
  customer: {
    title: "Create your account",
    subtitle: "Discover styles that feel like you.",
    endpoint: "/api/auth/register",
    login: "/login",
    image:
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1400&q=85",
    imageAlt: "Fashion shopping",
    tag: "YOUR STYLE JOURNEY",
    headline: "Your style. Your choices.",
    description: "Find your next favourite look with VisionCartAI.",
  },
  seller: {
    title: "Open your store",
    subtitle: "Bring your fashion business to VisionCartAI.",
    endpoint: "/api/auth/seller/register",
    login: "/seller/login",
    image:
      "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1400&q=85",
    imageAlt: "Modern clothing store",
    tag: "BUILT FOR SELLERS",
    headline: "Turn your products into possibilities.",
    description: "Create your store and apply to join our seller network.",
  },
  delivery: {
    title: "Join our delivery network",
    subtitle: "Create your delivery partner account.",
    endpoint: "/api/auth/delivery/register",
    login: "/delivery/login",
    image:
      "https://images.unsplash.com/photo-1526367790999-0150786686a2?auto=format&fit=crop&w=1400&q=85",
    imageAlt: "Motorcycle delivery rider",
    tag: "DELIVER WITH CONFIDENCE",
    headline: "Every delivery makes a difference.",
    description: "Register as a delivery partner and get started with VisionCartAI.",
  },
};

export default function PortalRegister({
  portal,
}: {
  portal: RegisterPortal;
}) {
  const c = config[portal];

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [storeName, setStoreName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [verificationPending, setVerificationPending] = useState(false);
  const [otp, setOtp] = useState("");
  const [expiresIn, setExpiresIn] = useState(0);
  const [resendWait, setResendWait] = useState(0);
  const countdownActive = verificationPending && (expiresIn > 0 || resendWait > 0);

  useEffect(() => {
    if (!countdownActive) return;
    const timer = window.setInterval(() => {
      setExpiresIn((value) => Math.max(0, value - 1));
      setResendWait((value) => Math.max(0, value - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [countdownActive]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");
    setStatusMessage("");
    setLoading(true);

    try {
      const apiBase = (
        process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"
      ).replace(/\/$/, "");

      const body: Record<string, string> = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
      };

      if (portal === "seller") {
        body.store_name = storeName.trim();
      }

      if (portal === "customer" || portal === "delivery") {
        body.phone = phone.trim();
      }

      const response = await fetch(`${apiBase}${c.endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        setMessage(apiErrorMessage(result, "Registration failed. Please check your details and try again."));
        return;
      }

      const data = result?.data;
      if (portal === "customer") {
        if (typeof data?.email !== "string" || typeof data?.message !== "string") {
          setMessage("The registration service returned an invalid response. Please try again.");
          return;
        }
        setPassword("");
        setVerificationPending(true);
        setExpiresIn(typeof data.expires_in === "number" ? data.expires_in : 300);
        setResendWait(typeof data.resend_cooldown === "number" ? data.resend_cooldown : 60);
        setStatusMessage(data.message);
        return;
      }

      setSuccess(true);
      setPassword("");
      setMessage(typeof data?.message === "string" ? data.message : "Application submitted. Your account is pending approval.");
    } catch {
      setMessage("Unable to connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOTP(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setStatusMessage("");
    setLoading(true);

    try {
      const apiBase = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");
      const response = await fetch(`${apiBase}/api/auth/verify-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), otp }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        setMessage(apiErrorMessage(result, "That code could not be verified. Request a new code and try again."));
        return;
      }

      const verificationMessage = result?.data?.message;
      if (typeof verificationMessage !== "string") {
        setMessage("The verification service returned an invalid response. Please try again.");
        return;
      }
      setVerificationPending(false);
      setSuccess(true);
      setOtp("");
      setMessage(verificationMessage);
    } catch {
      setMessage("Unable to connect to the verification service. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResendOTP() {
    if (loading || resendWait > 0) return;
    setMessage("");
    setStatusMessage("");
    setLoading(true);

    try {
      const apiBase = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");
      const response = await fetch(`${apiBase}/api/auth/resend-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        if (response.status === 429) {
          const retryAfter = Number(response.headers.get("Retry-After"));
          setResendWait(Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : 60);
        }
        setMessage(apiErrorMessage(result, "A new code could not be requested. Please try again later."));
        return;
      }

      const data = result?.data;
      if (typeof data?.message !== "string") {
        setMessage("The verification service returned an invalid response. Please try again.");
        return;
      }
      setOtp("");
      if (typeof data.expires_in === "number") setExpiresIn(data.expires_in);
      setResendWait(typeof data.resend_cooldown === "number" ? data.resend_cooldown : 60);
      setStatusMessage(data.message);
    } catch {
      setMessage("Unable to connect to the verification service. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] p-3 sm:p-6 lg:p-10">
      <div className="mx-auto grid min-h-[calc(100vh-24px)] max-w-7xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm sm:min-h-[calc(100vh-48px)] lg:grid-cols-2">
        <section className="flex items-center justify-center px-6 py-10 sm:px-12 lg:px-16">
          <div className="w-full max-w-md">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-700 text-lg font-bold text-white">
                V
              </span>
              <span className="text-xl font-bold tracking-tight text-slate-900">
                VisionCart<span className="text-blue-700">AI</span>
              </span>
            </Link>

            <div className="mt-9">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
                {c.tag}
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                {c.title}
              </h1>
              <p className="mt-3 text-base leading-7 text-slate-500">
                {c.subtitle}
              </p>
            </div>

            {verificationPending ? (
              <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">Email verification</p>
                <h2 className="mt-3 text-2xl font-semibold text-slate-900">Check your inbox</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Enter the six-digit code sent to <strong>{email}</strong>.
                </p>
                <p className={`mt-3 text-sm ${expiresIn > 0 ? "text-slate-600" : "font-semibold text-red-700"}`} aria-live="polite">
                  {expiresIn > 0 ? `Code expires in ${formatDuration(expiresIn)}.` : "This code has expired. Request a new one."}
                </p>
                <form onSubmit={handleVerifyOTP} className="mt-5 space-y-4">
                  <label htmlFor="email-otp" className="block text-sm font-medium text-slate-700">Verification code</label>
                  <input
                    id="email-otp"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9]{6}"
                    minLength={6}
                    maxLength={6}
                    required
                    value={otp}
                    onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="000000"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-center text-2xl font-semibold tracking-[0.4em] text-slate-900 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
                  />
                  {statusMessage && <p role="status" className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">{statusMessage}</p>}
                  {message && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{message}</p>}
                  <button type="submit" disabled={loading || otp.length !== 6 || expiresIn === 0} className="w-full rounded-xl bg-blue-700 px-5 py-3.5 font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60">
                    {loading ? "Verifying..." : "Verify email"}
                  </button>
                </form>
                <button type="button" onClick={() => void handleResendOTP()} disabled={loading || resendWait > 0} className="mt-4 w-full py-2 text-sm font-semibold text-blue-700 hover:underline disabled:cursor-not-allowed disabled:text-slate-400 disabled:no-underline">
                  {resendWait > 0 ? `Resend code in ${formatDuration(resendWait)}` : "Resend code"}
                </button>
              </section>
            ) : success ? (
              <div className="mt-8 rounded-2xl border border-blue-100 bg-blue-50 p-5">
                <p className="font-semibold text-slate-900">{message}</p>
                {portal !== "customer" && (
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    You can sign in after your account is approved.
                  </p>
                )}
                <Link
                  href={c.login}
                  className="mt-5 inline-flex rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800"
                >
                  Go to login
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-7 space-y-4">
                <div>
                  <label htmlFor="name" className="mb-2 block text-sm font-medium text-slate-700">
                    Full name
                  </label>
                  <input
                    id="name"
                    required
                    minLength={2}
                    maxLength={100}
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
                  />
                </div>

                {portal === "seller" && (
                  <div>
                    <label htmlFor="storeName" className="mb-2 block text-sm font-medium text-slate-700">
                      Store name
                    </label>
                    <input
                      id="storeName"
                      required
                      minLength={2}
                      maxLength={150}
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      placeholder="Your store name"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
                    />
                  </div>
                )}\n                {(portal === "customer" || portal === "delivery") && (
                  <div>
                    <label htmlFor="phone" className="mb-2 block text-sm font-medium text-slate-700">
                      Mobile number
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      required
                      minLength={portal === "customer" ? 10 : 8}
                      maxLength={portal === "customer" ? 13 : 20}
                      pattern={portal === "customer" ? "(?:\\+91)?[6-9][0-9]{9}" : undefined}
                      autoComplete="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder={portal === "customer" ? "10-digit mobile number" : "Your contact number"}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
                    />
                    {portal === "customer" && <p className="mt-1 text-xs text-slate-500">Enter a valid Indian mobile number, with optional +91.</p>}
                  </div>
                )}

                <div>
                  <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">
                    Email address
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-700">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    required
                    minLength={8}
                    maxLength={128}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a password"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
                  />
                </div>

                {message && (
                  <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                    {message}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-blue-700 px-5 py-3.5 font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading
                    ? "Creating account..."
                    : portal === "customer"
                      ? "Create account"
                      : portal === "seller"
                        ? "Submit seller application"
                        : "Apply as delivery partner"}
                </button>
              </form>
            )}

            <p className="mt-6 text-center text-sm text-slate-500">
              Already have an account?{" "}
              <Link href={c.login} className="font-semibold text-blue-700 hover:underline">
                Sign in
              </Link>
            </p>

            <p className="mt-8 text-center text-xs text-slate-400">
              © {new Date().getFullYear()} VisionCartAI. All rights reserved.
            </p>
          </div>
        </section>

        <section className="relative hidden min-h-[650px] overflow-hidden bg-slate-200 lg:block">
          <img
            src={c.image}
            alt={c.imageAlt}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/10 to-slate-950/10" />

          <div className="absolute left-10 top-10 rounded-full border border-white/40 bg-white/20 px-4 py-2 text-xs font-semibold text-white backdrop-blur-md">
            {c.tag}
          </div>

          <div className="absolute bottom-0 p-10 xl:p-14">
            <h2 className="max-w-lg text-4xl font-semibold leading-tight text-white xl:text-5xl">
              {c.headline}
            </h2>
            <p className="mt-4 max-w-md text-base leading-7 text-white/90">
              {c.description}
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
