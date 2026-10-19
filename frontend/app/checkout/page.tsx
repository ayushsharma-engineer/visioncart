"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Address } from "@/types/domain";
import { orders, payments, integration, type PaymentMethod } from "@/lib/services";
import { useCart } from "@/lib/stores/cart";
import { useDocumentTitle } from "@/lib/hooks/misc";
import { describeError, isNotConnected } from "@/lib/core/errors";
import { openRazorpayCheckout } from "@/lib/payments/razorpay";
import { cn } from "@/lib/core/utils";
import { money } from "@/lib/format";
import { RequireAuth } from "@/components/providers/require-auth";
import { useAuth } from "@/components/providers/auth";
import { useToast } from "@/components/providers/toast";
import { AddressManager } from "@/components/checkout/address-manager";
import { PaymentMethodPicker, PAYMENT_METHODS } from "@/components/checkout/payment-methods";
import { OrderSummary } from "@/components/cart/order-summary";
import { SafeImage } from "@/components/ui/safe-image";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { EmptyState, NotConnected } from "@/components/ui/states";

const STEPS = ["Address", "Payment", "Review"] as const;

function CheckoutFlow() {
  useDocumentTitle("Checkout");
  const router = useRouter();
  const toast = useToast();
  const { user } = useAuth();
  const cart = useCart();
  const [step, setStep] = useState(0);
  const [address, setAddress] = useState<Address | null>(null);
  const [method, setMethod] = useState<PaymentMethod | null>(null);
  const [busy, setBusy] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState<number | null>(null);

  const ordersReady = integration.orders.state !== "missing";
  const onlineReady = ordersReady && integration.payments.state !== "missing";

  if (cart.lines.length === 0 && placedOrderId === null) {
    return <div className="mx-auto max-w-3xl px-4 py-16"><EmptyState icon="bag" title="Your bag is empty" text="Add items to your bag before checking out." action={{ label: "Browse products", href: "/shop" }} /></div>;
  }

  const place = async () => {
    if (!address || !method) return;
    setBusy(true);
    try {
      // 1. The SERVER creates the order and re-prices every line; we only send ids and quantities.
      const order = await orders.create({
        addressId: address.id, paymentMethod: method,
        items: cart.lines.map((l) => ({ productId: l.productId, variantId: l.variantId, quantity: l.quantity })),
      });
      setPlacedOrderId(order.id);

      if (method !== "cod") {
        // 2. Server creates the Razorpay order; 3. customer pays; 4. server verifies the signature.
        const init = await payments.initiate(order.id);
        const result = await openRazorpayCheckout({ init, description: `Order #${order.id}`, prefill: { name: address.full_name, email: user?.email, contact: address.phone } });
        if (result.status === "dismissed") { toast.info("Payment cancelled. Your order is saved — you can pay from your orders page."); router.push(`/account/orders/${order.id}`); return; }
        if (result.status === "failed") { toast.error(result.reason); router.push(`/account/orders/${order.id}`); return; }
        await payments.verify(order.id, result.payload);
      }
      cart.clear();
      router.push(`/account/orders/${order.id}?placed=1`);
    } catch (e) {
      toast.error(isNotConnected(e) ? "Ordering isn't connected yet, so nothing was placed or charged." : describeError(e));
    } finally { setBusy(false); }
  };

  const canContinue = step === 0 ? !!address : step === 1 ? !!method : true;

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-8 lg:px-8">
      <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Checkout</h1>

      <ol className="mt-6 flex items-center gap-2 text-sm" aria-label="Checkout steps">
        {STEPS.map((s, i) => (
          <li key={s} className="flex items-center gap-2">
            <button type="button" disabled={i > step} onClick={() => setStep(i)} aria-current={i === step ? "step" : undefined}
              className={cn("flex items-center gap-2 rounded-full py-1.5 pl-1.5 pr-4 font-medium transition", i === step ? "bg-ink text-white" : i < step ? "bg-sunken text-ink" : "text-muted")}>
              <span className={cn("flex size-6 items-center justify-center rounded-full text-xs", i === step ? "bg-white text-ink" : i < step ? "bg-ink text-white" : "border border-line-strong")}>{i < step ? <Icon name="check" size={13} /> : i + 1}</span>{s}
            </button>
            {i < STEPS.length - 1 && <span className="h-px w-6 bg-line-strong sm:w-12" />}
          </li>
        ))}
      </ol>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_400px]">
        <div>
          {!ordersReady && <div className="mb-6"><NotConnected compact domain="Ordering" needs={["Order creation + order history endpoints", "Payment endpoints for Razorpay"]}><p className="mt-2 text-xs text-muted">Your bag is safe. Nothing can be placed or charged until ordering is connected.</p></NotConnected></div>}

          {step === 0 && (<section aria-labelledby="s0"><h2 id="s0" className="mb-4 font-display text-xl font-semibold">Delivery address</h2><AddressManager selectedId={address?.id} onSelect={setAddress} /></section>)}

          {step === 1 && (<section aria-labelledby="s1"><h2 id="s1" className="mb-4 font-display text-xl font-semibold">Payment method</h2>
            <PaymentMethodPicker value={method} onChange={setMethod} onlineAvailable={onlineReady} /></section>)}

          {step === 2 && address && method && (
            <section aria-labelledby="s2" className="space-y-6"><h2 id="s2" className="font-display text-xl font-semibold">Review your order</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-line bg-surface p-5 text-sm"><p className="flex items-center justify-between font-semibold">Deliver to <button type="button" className="text-xs text-brand underline" onClick={() => setStep(0)}>Change</button></p>
                  <p className="mt-2 leading-6 text-ink-soft">{address.full_name}<br />{address.address_line}, {address.city}<br />{address.state} {address.postal_code}<br />{address.phone}</p></div>
                <div className="rounded-2xl border border-line bg-surface p-5 text-sm"><p className="flex items-center justify-between font-semibold">Payment <button type="button" className="text-xs text-brand underline" onClick={() => setStep(1)}>Change</button></p>
                  <p className="mt-2 text-ink-soft">{PAYMENT_METHODS.find((m) => m.id === method)?.label}</p></div>
              </div>
              <ul className="divide-y divide-line rounded-2xl border border-line bg-surface">
                {cart.lines.map((l) => (<li key={`${l.productId}:${l.variantId}`} className="flex items-center gap-4 p-4"><SafeImage src={l.image} alt="" width={160} className="size-16 rounded-xl" />
                  <div className="min-w-0 flex-1 text-sm"><p className="line-clamp-1 font-medium">{l.name}</p><p className="text-muted">{[l.color, l.size && `Size ${l.size}`].filter(Boolean).join(" · ")} · Qty {l.quantity}</p></div>
                  <p className="text-sm font-semibold">{money(l.price * l.quantity)}</p></li>))}
              </ul>
              <p className="text-xs text-muted">The final amount is confirmed by our server when the order is created. <Link href="/cart" className="underline">Edit bag</Link></p>
            </section>
          )}

          <div className="mt-8 flex items-center justify-between">
            <Button variant="ghost" onClick={() => (step === 0 ? router.push("/cart") : setStep(step - 1))}><Icon name="arrow-left" size={16} />{step === 0 ? "Back to bag" : "Back"}</Button>
            {step < 2 && <Button variant="dark" disabled={!canContinue} onClick={() => setStep(step + 1)}>Continue<Icon name="arrow-right" size={16} /></Button>}
          </div>
        </div>

        <div className="lg:sticky lg:top-32 lg:self-start">
          <OrderSummary totals={cart.totals}>
            {step === 2 ? (
              <>
                <Button variant="primary" size="lg" full loading={busy} disabled={!ordersReady || !address || !method || (method !== "cod" && !onlineReady)} onClick={place}>
                  {!ordersReady ? "Ordering not connected yet" : method === "cod" ? "Place order" : `Pay ${money(cart.totals.total)}`}
                </Button>
                <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted"><Icon name="lock" size={13} />Secure, encrypted checkout</p>
              </>
            ) : <p className="text-xs text-muted">Complete the steps to review and place your order.</p>}
          </OrderSummary>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return <RequireAuth><CheckoutFlow /></RequireAuth>;
}
