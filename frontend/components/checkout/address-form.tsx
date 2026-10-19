"use client";

import { useState } from "react";
import type { Address, AddressInput } from "@/types/domain";
import { INDIAN_STATES } from "@/lib/core/geo";
import * as v from "@/lib/core/validators";
import { ApiError, describeError } from "@/lib/core/errors";
import { Field, Input, Select, Checkbox } from "../ui/field";
import { Button } from "../ui/button";

type Errs = Partial<Record<keyof AddressInput, string>>;

export function AddressForm({ initial, onSubmit, onCancel, submitLabel = "Save address" }: { initial?: Address; onSubmit: (a: AddressInput) => Promise<void>; onCancel: () => void; submitLabel?: string }) {
  const [f, setF] = useState<AddressInput>({
    full_name: initial?.full_name ?? "", phone: initial?.phone ?? "", address_line: initial?.address_line ?? "",
    city: initial?.city ?? "", state: initial?.state ?? "", postal_code: initial?.postal_code ?? "",
    country: initial?.country ?? "India", is_default: initial?.is_default ?? false,
  });
  const [errors, setErrors] = useState<Errs>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const india = f.country.trim().toLowerCase() === "india";
  const set = <K extends keyof AddressInput>(k: K, val: AddressInput[K]) => setF((s) => ({ ...s, [k]: val }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Errs = {
      full_name: v.required("Full name")(f.full_name) ?? undefined,
      phone: (india ? v.indianPhone : v.phone)(f.phone) ?? undefined,
      address_line: v.required("Address")(f.address_line) ?? undefined,
      city: v.required("City")(f.city) ?? undefined,
      state: v.required("State")(f.state) ?? undefined,
      postal_code: (india ? v.indianPincode : v.required("Postal code"))(f.postal_code) ?? undefined,
      country: v.required("Country")(f.country) ?? undefined,
    };
    setErrors(errs); setFormError(null);
    if (Object.values(errs).some(Boolean)) return;
    setBusy(true);
    try {
      await onSubmit({ ...f, full_name: f.full_name.trim(), address_line: f.address_line.trim(), city: f.city.trim(), postal_code: f.postal_code.trim(), phone: f.phone.trim() });
    } catch (ex) {
      if (ex instanceof ApiError && ex.fields) setErrors(ex.fields as Errs);
      setFormError(describeError(ex));
    } finally { setBusy(false); }
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      {formError && <div role="alert" className="rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">{formError}</div>}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" error={errors.full_name}>{(p) => <Input {...p} autoComplete="name" value={f.full_name} onChange={(e) => set("full_name", e.target.value)} error={errors.full_name} />}</Field>
        <Field label="Mobile number" error={errors.phone}>{(p) => <Input {...p} type="tel" inputMode="tel" autoComplete="tel" value={f.phone} onChange={(e) => set("phone", e.target.value)} error={errors.phone} placeholder={india ? "10-digit mobile" : ""} />}</Field>
      </div>
      <Field label="Address" error={errors.address_line} hint="House no., building, street, area">{(p) => <Input {...p} autoComplete="street-address" value={f.address_line} onChange={(e) => set("address_line", e.target.value)} error={errors.address_line} />}</Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="City" error={errors.city}>{(p) => <Input {...p} autoComplete="address-level2" value={f.city} onChange={(e) => set("city", e.target.value)} error={errors.city} />}</Field>
        <Field label={india ? "PIN code" : "Postal code"} error={errors.postal_code}>{(p) => <Input {...p} inputMode="numeric" autoComplete="postal-code" maxLength={india ? 6 : 12} value={f.postal_code} onChange={(e) => set("postal_code", e.target.value)} error={errors.postal_code} />}</Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="State" error={errors.state}>{(p) => india ? (
          <Select {...p} autoComplete="address-level1" value={f.state} onChange={(e) => set("state", e.target.value)} error={errors.state}><option value="">Select state</option>{INDIAN_STATES.map((s) => <option key={s}>{s}</option>)}</Select>
        ) : <Input {...p} autoComplete="address-level1" value={f.state} onChange={(e) => set("state", e.target.value)} error={errors.state} />}</Field>
        <Field label="Country" error={errors.country}>{(p) => <Input {...p} autoComplete="country-name" value={f.country} onChange={(e) => setF((s) => ({ ...s, country: e.target.value, state: "" }))} error={errors.country} />}</Field>
      </div>
      <Checkbox label="Make this my default address" checked={f.is_default} onChange={(e) => set("is_default", e.target.checked)} />
      <div className="flex gap-3 pt-2"><Button type="submit" variant="dark" loading={busy}>{submitLabel}</Button><Button variant="ghost" onClick={onCancel} disabled={busy}>Cancel</Button></div>
    </form>
  );
}
