"use client";

import { useDocumentTitle } from "@/lib/hooks/misc";
import { AddressManager } from "@/components/checkout/address-manager";

export default function AddressesPage() {
  useDocumentTitle("Addresses");
  return (
    <section>
      <h2 className="font-display text-2xl font-semibold">Saved addresses</h2>
      <p className="mb-6 mt-1 text-sm text-muted">Where should we deliver your orders?</p>
      <AddressManager />
    </section>
  );
}
