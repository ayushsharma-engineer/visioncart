"use client";

import Link from "next/link";
import { useState } from "react";

function errorMessage(result: unknown) {
  if (!result || typeof result !== "object") return "We could not submit your request. Please try again.";
  const body = result as { detail?: unknown; error?: { message?: unknown } };
  if (typeof body.detail === "string") return body.detail;
  if (typeof body.error?.message === "string") return body.error.message;
  return "We could not submit your request. Please try again.";
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const apiBase = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");
      const response = await fetch(`${apiBase}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        setError(errorMessage(result));
        return;
      }

      const confirmation = result?.data?.message;
      if (typeof confirmation !== "string") {
        setError("The password recovery service returned an invalid response.");
        return;
      }
      setMessage(confirmation);
    } catch {
      setError("Unable to connect to the password recovery service. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] px-4 py-10 sm:px-6 lg:py-16">
      <section className="mx-auto w-full max-w-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-9">
        <Link href="/" className="text-xl font-bold tracking-tight text-slate-900">VisionCart<span className="text-blue-700">AI</span></Link>
        <p className="mt-8 text-xs font-bold uppercase tracking-[0.18em] text-blue-700">Account recovery</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-900">Forgot your password?</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">Enter the email address associated with your customer account. If it is eligible, we will send a secure reset link.</p>

        {message ? (
          <div className="mt-7 border border-blue-100 bg-blue-50 p-5" role="status">
            <p className="text-sm leading-6 text-slate-800">{message}</p>
            <p className="mt-2 text-xs leading-5 text-slate-600">If you do not receive a link, check your address or try again later.</p>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-7 space-y-4">
            <div>
              <label htmlFor="recovery-email" className="block text-sm font-medium text-slate-700">Email address</label>
              <input id="recovery-email" name="email" type="email" autoComplete="email" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 h-12 w-full rounded-md border border-slate-300 px-4 text-slate-900 outline-none focus:border-blue-700 focus:ring-4 focus:ring-blue-700/10" />
            </div>
            {error && <p role="alert" className="border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
            <button type="submit" disabled={loading} className="w-full bg-blue-700 px-5 py-3.5 font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60">
              {loading ? "Submitting..." : "Send reset link"}
            </button>
          </form>
        )}

        <Link href="/login" className="mt-6 inline-block text-sm font-semibold text-blue-700 hover:underline">Back to sign in</Link>
      </section>
    </main>
  );
}
