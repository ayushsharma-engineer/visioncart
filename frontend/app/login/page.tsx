"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/providers/auth";
import { AuthShell } from "@/components/layout/auth-shell";
import { PasswordInput } from "@/components/layout/password-input";
import { Field, Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/core/errors";
import { safeNextPath } from "@/lib/core/utils";
import { useDocumentTitle } from "@/lib/hooks/misc";
import * as v from "@/lib/core/validators";

function LoginForm() {
  useDocumentTitle("Sign in");
  const router = useRouter();
  const next = safeNextPath(useSearchParams().get("next"));
  const { status, login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (status === "authenticated" && !busy) router.replace(next); }, [status, busy, next, router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = { email: v.email(email) ?? undefined, password: v.required("Password")(password) ?? undefined };
    setErrors(errs); setFormError(null);
    if (errs.email || errs.password) return;
    setBusy(true);
    try {
      await login(email, password);
      router.replace(next);
    } catch (ex) {
      if (ex instanceof ApiError && ex.status === 401) setFormError("That email and password don't match. Please try again.");
      // The backend currently answers a wrong password with a 500 (missing HTTPException import), so a
      // server error here is most often bad credentials. Say both, without blaming the user.
      else if (ex instanceof ApiError && ex.status >= 500) setFormError("We couldn't sign you in. Please check your email and password and try again. If this keeps happening, the server may be having trouble.");
      else setFormError(ex instanceof Error ? ex.message : "Something went wrong.");
    } finally { setBusy(false); }
  };

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to continue shopping with VisionCart.">
      <form onSubmit={submit} noValidate className="space-y-5">
        {formError && <div role="alert" className="rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">{formError}</div>}
        <Field label="Email" error={errors.email}>{(p) => <Input {...p} type="email" autoComplete="email" inputMode="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} />}</Field>
        <Field label="Password" error={errors.password}>{(p) => <PasswordInput {...p} autoComplete="current-password" placeholder="Your password" value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password} />}</Field>
        <Button type="submit" variant="dark" size="lg" full loading={busy}>Sign in</Button>
      </form>
      <p className="mt-8 text-center text-sm text-muted">New to VisionCart?{" "}
        <Link href={next === "/" ? "/register" : `/register?next=${encodeURIComponent(next)}`} className="font-semibold text-brand hover:underline">Create an account</Link></p>
    </AuthShell>
  );
}

export default function LoginPage() {
  return <Suspense fallback={null}><LoginForm /></Suspense>;
}
