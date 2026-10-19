import type { RazorpayInit, RazorpaySuccess } from "../services/types";

/**
 * Razorpay Checkout.js glue, written to Razorpay's documented web checkout API.
 * NOT yet exercised against a live backend: it needs payments.initiate() / payments.verify()
 * (see INTEGRATION.md). The secret key never reaches the browser; only keyId + the order id do.
 */

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  order_id: string;
  prefill?: { name?: string; email?: string; contact?: string };
  theme?: { color?: string };
  handler: (response: RazorpaySuccess) => void;
  modal?: { ondismiss?: () => void };
}
interface RazorpayInstance {
  open(): void;
  on(event: "payment.failed", cb: (resp: { error?: { description?: string } }) => void): void;
}
type RazorpayCtor = new (opts: RazorpayOptions) => RazorpayInstance;

declare global {
  interface Window { Razorpay?: RazorpayCtor }
}

const SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";
let loading: Promise<RazorpayCtor> | null = null;

export function loadRazorpay(): Promise<RazorpayCtor> {
  if (typeof window === "undefined") return Promise.reject(new Error("Payments can only start in the browser."));
  if (window.Razorpay) return Promise.resolve(window.Razorpay);
  loading ??= new Promise<RazorpayCtor>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = SCRIPT_SRC;
    s.async = true;
    s.onload = () => (window.Razorpay ? resolve(window.Razorpay) : reject(new Error("Payment window failed to initialise.")));
    s.onerror = () => { loading = null; reject(new Error("We couldn't load the payment window. Check your connection and try again.")); };
    document.head.appendChild(s);
  });
  return loading;
}

export interface OpenCheckoutArgs {
  init: RazorpayInit;
  description: string;
  prefill?: { name?: string; email?: string; contact?: string };
}

export type CheckoutResult =
  | { status: "success"; payload: RazorpaySuccess }
  | { status: "dismissed" }
  | { status: "failed"; reason: string };

/** Resolves exactly once: success, user closed the window, or the payment failed. */
export async function openRazorpayCheckout({ init, description, prefill }: OpenCheckoutArgs): Promise<CheckoutResult> {
  const Razorpay = await loadRazorpay();
  return new Promise<CheckoutResult>((resolve) => {
    let done = false;
    const finish = (r: CheckoutResult) => { if (!done) { done = true; resolve(r); } };
    const rzp = new Razorpay({
      key: init.keyId,
      amount: init.amount,
      currency: init.currency,
      name: "VisionCart",
      description,
      order_id: init.razorpayOrderId,
      prefill,
      theme: { color: "#16130F" },
      handler: (payload) => finish({ status: "success", payload }),
      modal: { ondismiss: () => finish({ status: "dismissed" }) },
    });
    rzp.on("payment.failed", (resp) => finish({ status: "failed", reason: resp.error?.description ?? "The payment didn't go through." }));
    rzp.open();
  });
}
