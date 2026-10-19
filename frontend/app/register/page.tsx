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

type Errs = Partial<Record<"name" | "email" | "password" | "confirm", string>>;

function RegisterForm() {
  useDocumentTitle("Create account");
  const router = useRouter();
  const next = safeNextPath(useSearchParams().get("next"));
  const { status, register } = useAuth();
  const [f, setF] = useState({ name: "", email: "", password: "", confirm: "" });
  const [errors, setErrors] = useState<Errs>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF((s) => ({ ...s, [k]: e.target.value }));

  useEffect(() => { if (status === "authenticated" && !busy) router.replace(next); }, [status, busy, next, router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Errs = {
      name: v.required("Name")(f.name) ?? undefined,
      email: v.email(f.email) ?? undefined,
      password: v.password(f.password) ?? undefined,
      confirm: f.confirm !== f.password ? "Passwords don't match" : undefined,
    };
    setErrors(errs); setFormError(null);
    if (Object.values(errs).some(Boolean)) return;
    setBusy(true);
    try {
      await register(f.name, f.email, f.password);
      router.replace(next);
    } catch (ex) {
      if (ex instanceof ApiError && ex.fields) {
        setErrors({ name: ex.fields.name, email: ex.fields.email, password: ex.fields.password });
        setFormError(ex.message);
      } else if (ex instanceof ApiError && (ex.status === 409 || ex.status >= 500)) {
        // The backend's POST /users has no duplicate-email handling, so a taken email surfaces as a 500.
        setFormError("We couldn't create your account. If you've already registered with this email, try signing in instead.");
      } else setFormError(ex instanceof Error ? ex.message : "Something went wrong.");
    } finally { setBusy(false); }
  };

  return (
    <AuthShell title="Create your account" subtitle="Join VisionCart to save looks, track orders and check out faster.">
      <form onSubmit={submit} noValidate className="space-y-5">
        {formError && <div role="alert" className="rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">{formError}</div>}
        <Field label="Full name" error={errors.name}>{(p) => <Input {...p} autoComplete="name" placeholder="Your name" value={f.name} onChange={set("name")} error={errors.name} />}</Field>
        <Field label="Email" error={errors.email}>{(p) => <Input {...p} type="email" autoComplete="email" inputMode="email" placeholder="you@example.com" value={f.email} onChange={set("email")} error={errors.email} />}</Field>
        <Field label="Password" error={errors.password} hint="At least 8 characters.">{(p) => <PasswordInput {...p} autoComplete="new-password" value={f.password} onChange={set("password")} error={errors.password} />}</Field>
        <Field label="Confirm password" error={errors.confirm}>{(p) => <PasswordInput {...p} autoComplete="new-password" value={f.confirm} onChange={set("confirm")} error={errors.confirm} />}</Field>
        <Button type="submit" variant="dark" size="lg" full loading={busy}>Create account</Button>
      </form>
      <p className="mt-8 text-center text-sm text-muted">Already have an account?{" "}
        <Link href={next === "/" ? "/login" : `/login?next=${encodeURIComponent(next)}`} className="font-semibold text-brand hover:underline">Sign in</Link></p>
    </AuthShell>
  );
}

export default function RegisterPage() {
  return <Suspense fallback={null}><RegisterForm /></Suspense>;
}
