"use client";

import { useState } from "react";
import type { Product } from "@/types/domain";
import { catalog, type SellerProductInput, type SellerVariantInput } from "@/lib/services";
import { useAsync } from "@/lib/hooks/use-async";
import { describeError } from "@/lib/core/errors";
import { Field, Input, Select, Textarea } from "../ui/field";
import { Button } from "../ui/button";
import { Icon } from "../ui/icon";
import { SafeImage } from "../ui/safe-image";

interface Row extends SellerVariantInput { key: number }
type Errs = Record<string, string>;

let rowKey = 1;
const blankRow = (): Row => ({ key: rowKey++, sku: "", size: "", color: "", stock: 0, image_url: "" });

export function ProductForm({ initial, onSubmit, submitLabel }: { initial?: Product; onSubmit: (input: SellerProductInput) => Promise<void>; submitLabel: string }) {
  const cats = useAsync("seller:form-categories", (s) => catalog.listCategories({ signal: s }).catch(() => []));
  const [f, setF] = useState({
    name: initial?.name ?? "", description: initial?.description ?? "", category_id: initial ? String(initial.category_id) : "",
    price: initial ? String(initial.price) : "", stock: initial ? String(initial.stock) : "0", image_url: initial?.image_url ?? "", status: initial?.status ?? "active",
  });
  const [rows, setRows] = useState<Row[]>(initial?.variants.map((v) => ({ key: rowKey++, id: v.id, sku: v.sku, size: v.size ?? "", color: v.color ?? "", stock: v.stock, image_url: v.image_url ?? "" })) ?? []);
  const [errors, setErrors] = useState<Errs>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF((s) => ({ ...s, [k]: e.target.value }));
  const setRow = (key: number, patch: Partial<Row>) => setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Errs = {};
    const price = Number(f.price);
    if (!f.name.trim()) errs.name = "Product name is required";
    if (!f.category_id) errs.category_id = "Choose a category";
    if (!f.price || Number.isNaN(price) || price <= 0) errs.price = "Enter a price above 0";
    if (f.image_url && !/^https?:\/\//i.test(f.image_url.trim())) errs.image_url = "Use a full image URL starting with http(s)://";
    const stock = Number(f.stock);
    if (rows.length === 0 && (!Number.isInteger(stock) || stock < 0)) errs.stock = "Stock must be a whole number, 0 or more";
    const seen = new Set<string>();
    rows.forEach((r) => {
      const sku = r.sku.trim().toLowerCase();
      if (!sku) errs[`sku-${r.key}`] = "SKU required";
      else if (seen.has(sku)) errs[`sku-${r.key}`] = "Duplicate SKU";
      seen.add(sku);
      if (!Number.isInteger(Number(r.stock)) || Number(r.stock) < 0) errs[`stock-${r.key}`] = "Whole number ≥ 0";
    });
    setErrors(errs); setFormError(null);
    if (Object.keys(errs).length) return;

    setBusy(true);
    try {
      await onSubmit({
        name: f.name.trim(), description: f.description.trim() || null, category_id: Number(f.category_id), price,
        stock: rows.length ? rows.reduce((s, r) => s + Number(r.stock), 0) : stock,
        image_url: f.image_url.trim() || null, status: f.status,
        variants: rows.map((r) => ({ id: r.id, sku: r.sku.trim(), size: r.size?.trim() || null, color: r.color?.trim() || null, stock: Number(r.stock), image_url: r.image_url?.trim() || null })),
      });
    } catch (ex) { setFormError(describeError(ex)); } finally { setBusy(false); }
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-8">
      {formError && <div role="alert" className="rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">{formError}</div>}

      <section className="space-y-5 rounded-3xl border border-line bg-surface p-6">
        <h2 className="font-display text-xl font-semibold">Basics</h2>
        <Field label="Product name" error={errors.name}>{(p) => <Input {...p} maxLength={200} value={f.name} onChange={set("name")} error={errors.name} />}</Field>
        <Field label="Description" optional>{(p) => <Textarea {...p} value={f.description} onChange={set("description")} />}</Field>
        <div className="grid gap-5 sm:grid-cols-3">
          <Field label="Category" error={errors.category_id}>{(p) => <Select {...p} value={f.category_id} onChange={set("category_id")} error={errors.category_id} disabled={!cats.data?.length}><option value="">{cats.data?.length ? "Select…" : "Categories unavailable"}</option>{cats.data?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select>}</Field>
          <Field label="Price (₹)" error={errors.price}>{(p) => <Input {...p} inputMode="decimal" value={f.price} onChange={set("price")} error={errors.price} />}</Field>
          <Field label="Status">{(p) => <Select {...p} value={f.status} onChange={set("status")}><option value="active">Active</option><option value="inactive">Inactive</option><option value="draft">Draft</option></Select>}</Field>
        </div>
      </section>

      <section className="space-y-5 rounded-3xl border border-line bg-surface p-6">
        <h2 className="font-display text-xl font-semibold">Main image</h2>
        <div className="flex flex-wrap items-start gap-5">
          <SafeImage src={f.image_url.trim() || null} alt="Preview" width={240} className="size-28 rounded-2xl" />
          <Field label="Image URL" error={errors.image_url} hint="Paste a link to a hosted image. File upload isn't available yet." className="min-w-64 flex-1">{(p) => <Input {...p} inputMode="url" placeholder="https://…" value={f.image_url} onChange={set("image_url")} error={errors.image_url} />}</Field>
        </div>
      </section>

      <section className="space-y-5 rounded-3xl border border-line bg-surface p-6">
        <div className="flex items-center justify-between"><div><h2 className="font-display text-xl font-semibold">Sizes & colours</h2><p className="text-sm text-muted">Add a row per size/colour combination. Leave empty for a single-option product.</p></div>
          <Button variant="outline" size="sm" onClick={() => setRows((r) => [...r, blankRow()])}><Icon name="plus" size={15} />Add variant</Button></div>
        {rows.length === 0 ? (
          <Field label="Stock" error={errors.stock} className="max-w-48">{(p) => <Input {...p} inputMode="numeric" value={f.stock} onChange={set("stock")} error={errors.stock} />}</Field>
        ) : (
          <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-sm">
            <thead><tr className="text-left text-xs text-muted"><th className="pb-2 pr-2 font-medium">SKU</th><th className="pb-2 pr-2 font-medium">Size</th><th className="pb-2 pr-2 font-medium">Colour</th><th className="pb-2 pr-2 font-medium">Stock</th><th className="pb-2 pr-2 font-medium">Image URL</th><th /></tr></thead>
            <tbody>{rows.map((r) => (
              <tr key={r.key} className="align-top">
                <td className="pb-2 pr-2"><Input aria-label="SKU" value={r.sku} onChange={(e) => setRow(r.key, { sku: e.target.value })} error={errors[`sku-${r.key}`]} className="h-10" />{errors[`sku-${r.key}`] && <p role="alert" className="mt-1 text-xs text-danger">{errors[`sku-${r.key}`]}</p>}</td>
                <td className="pb-2 pr-2"><Input aria-label="Size" value={r.size ?? ""} onChange={(e) => setRow(r.key, { size: e.target.value })} className="h-10 w-24" /></td>
                <td className="pb-2 pr-2"><Input aria-label="Colour" value={r.color ?? ""} onChange={(e) => setRow(r.key, { color: e.target.value })} className="h-10 w-32" /></td>
                <td className="pb-2 pr-2"><Input aria-label="Stock" inputMode="numeric" value={r.stock} onChange={(e) => setRow(r.key, { stock: e.target.value === "" ? 0 : Number(e.target.value) })} error={errors[`stock-${r.key}`]} className="h-10 w-24" /></td>
                <td className="pb-2 pr-2"><Input aria-label="Variant image URL" value={r.image_url ?? ""} onChange={(e) => setRow(r.key, { image_url: e.target.value })} className="h-10" /></td>
                <td className="pb-2"><button type="button" aria-label="Remove variant" onClick={() => setRows((rs) => rs.filter((x) => x.key !== r.key))} className="flex size-10 items-center justify-center rounded-full text-danger hover:bg-danger-soft"><Icon name="trash" size={16} /></button></td>
              </tr>))}</tbody>
          </table></div>
        )}
      </section>

      <Button type="submit" variant="primary" size="lg" loading={busy}>{submitLabel}</Button>
    </form>
  );
}
