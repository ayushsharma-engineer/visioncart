"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function errorMessage(result: unknown) {
  if (!result || typeof result !== "object") return "This reset link is invalid or expired. Request a new one.";
  const body = result as { detail?: unknown; error?: { message?: unknown } };
  if (typeof body.detail === "string") return body.detail;
  if (typeof body.error?.message === "string") return body.error.message;
  return "This reset link is invalid or expired. Request a new one.";
}

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    if (!token) {
      setError("This reset link is missing its token. Request a new one.");
      return;
    }
    if (password !== confirmation) {
      setError("The passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const apiBase = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");
      const response = await fetch(`${apiBase}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        setError(errorMessage(result));
        return;
      }

      const confirmationMessage = result?.data?.message;
      if (typeof confirmationMessage !== "string") {
        setError("The password reset service returned an invalid response.");
        return;
      }
      setSuccess(confirmationMessage);
      setPassword("");
      setConfirmation("");
    } catch {
      setError("Unable to connect to the password reset service. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] px-4 py-10 sm:px-6 lg:py-16">
      <section className="mx-auto w-full max-w-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-9">
        <Link href="/" className="text-xl font-bold tracking-tight text-slate-900">VisionCart<span className="text-blue-700">AI</span></Link>
        <p className="mt-8 text-xs font-bold uppercase tracking-[0.18em] text-blue-700">Secure your account</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-900">Reset password</h1>
        {!token ? (
          <div className="mt-6 border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900" role="alert">
            This reset link is missing its token. <Link href="/forgot-password" className="font-semibold underline">Request a new link</Link>.
          </div>
        ) : success ? (
          <div className="mt-6 border border-green-200 bg-green-50 p-5" role="status">
            <p className="text-sm leading-6 text-green-900">{success}</p>
            <Link href="/login" className="mt-4 inline-block font-semibold text-blue-700 underline">Go to sign in</Link>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-7 space-y-4">
            <div>
              <label htmlFor="new-password" className="block text-sm font-medium text-slate-700">New password</label>
              <input id="new-password" type="password" autoComplete="new-password" required minLength={8} maxLength={128} value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 h-12 w-full rounded-md border border-slate-300 px-4 text-slate-900 outline-none focus:border-blue-700 focus:ring-4 focus:ring-blue-700/10" />
              <p className="mt-1 text-xs text-slate-500">Use 8 to 128 characters.</p>
            </div>
            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-slate-700">Confirm new password</label>
              <input id="confirm-password" type="password" autoComplete="new-password" required minLength={8} maxLength={128} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="mt-2 h-12 w-full rounded-md border border-slate-300 px-4 text-slate-900 outline-none focus:border-blue-700 focus:ring-4 focus:ring-blue-700/10" />
            </div>
            {error && <p role="alert" className="border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
            <button type="submit" disabled={loading} className="w-full bg-blue-700 px-5 py-3.5 font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60">
              {loading ? "Updating password..." : "Set new password"}
            </button>
          </form>
        )}
        <Link href="/login" className="mt-6 inline-block text-sm font-semibold text-blue-700 hover:underline">Back to sign in</Link>
      </section>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<main className="p-10 text-center text-sm text-slate-600" role="status">Loading reset form...</main>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
