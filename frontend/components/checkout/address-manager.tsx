"use client";

import { useState } from "react";
import type { Address, AddressInput } from "@/types/domain";
import { addresses } from "@/lib/services";
import { useAsync } from "@/lib/hooks/use-async";
import { describeError } from "@/lib/core/errors";
import { cn } from "@/lib/core/utils";
import { AddressForm } from "./address-form";
import { Sheet } from "../ui/sheet";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Icon } from "../ui/icon";
import { Skeleton } from "../ui/skeleton";
import { AsyncError, EmptyState } from "../ui/states";
import { useToast } from "../providers/toast";

/** Used by checkout (select mode) and the account page (manage mode). */
export function AddressManager({ selectedId, onSelect }: { selectedId?: number | null; onSelect?: (a: Address) => void }) {
  const toast = useToast();
  const { data, error, loading, reload } = useAsync("addresses", (s) => addresses.list({ signal: s }));
  const [editing, setEditing] = useState<Address | "new" | null>(null);
  const selecting = !!onSelect;

  if (error) return <AsyncError error={error} onRetry={reload} />;
  if (loading && !data) return <div className="space-y-3"><Skeleton className="h-28" /><Skeleton className="h-28" /></div>;

  const save = async (input: AddressInput) => {
    const saved = editing && editing !== "new" ? await addresses.update(editing.id, input) : await addresses.create(input);
    toast.success("Address saved");
    setEditing(null); reload();
    if (selecting && editing === "new") onSelect?.(saved);
  };
  const act = async (fn: () => Promise<unknown>, ok: string) => {
    try { await fn(); toast.success(ok); reload(); } catch (e) { toast.error(describeError(e)); }
  };

  const list = data ?? [];
  return (
    <div>
      {list.length === 0 ? <EmptyState icon="map-pin" title="No saved addresses" text="Add a delivery address to continue." /> : (
        <ul className="grid gap-4 sm:grid-cols-2" role={selecting ? "radiogroup" : undefined} aria-label="Delivery addresses">
          {list.map((a) => {
            const on = selectedId === a.id;
            return (
              <li key={a.id} className={cn("relative rounded-2xl border bg-surface p-5 text-sm", on ? "border-ink ring-2 ring-ink/10" : "border-line")}>
                {selecting && <button type="button" role="radio" aria-checked={on} aria-label={`Deliver to ${a.full_name}, ${a.address_line}`} onClick={() => onSelect?.(a)} className="absolute inset-0 rounded-2xl" />}
                <div className="flex items-start justify-between gap-2"><p className="font-semibold">{a.full_name}</p>{a.is_default && <Badge tone="dark">Default</Badge>}</div>
                <p className="mt-2 leading-6 text-ink-soft">{a.address_line}<br />{a.city}, {a.state} {a.postal_code}<br />{a.country}</p>
                <p className="mt-2 text-muted">Mobile: {a.phone}</p>
                <div className="relative mt-4 flex flex-wrap gap-4 text-xs font-semibold">
                  <button type="button" onClick={() => setEditing(a)} className="flex items-center gap-1 hover:text-brand"><Icon name="edit" size={13} />Edit</button>
                  {!a.is_default && <button type="button" onClick={() => act(() => addresses.setDefault(a.id), "Default address updated")} className="hover:text-brand">Make default</button>}
                  <button type="button" onClick={() => { if (window.confirm("Delete this address?")) act(() => addresses.remove(a.id), "Address deleted"); }} className="flex items-center gap-1 text-danger"><Icon name="trash" size={13} />Delete</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <Button variant="outline" className="mt-5" onClick={() => setEditing("new")}><Icon name="plus" size={16} />Add new address</Button>
      <Sheet open={editing !== null} onClose={() => setEditing(null)} title={editing && editing !== "new" ? "Edit address" : "New address"}>
        {editing !== null && <AddressForm initial={editing === "new" ? undefined : editing} onSubmit={save} onCancel={() => setEditing(null)} />}
      </Sheet>
    </div>
  );
}
