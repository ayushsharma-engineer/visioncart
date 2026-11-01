"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { getCartSnapshot, subscribeToStore, type CartItem, writeCart } from "@/lib/store";

const API = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");

type RazorpaySuccessResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill?: { name?: string; email?: string; contact?: string };
  theme?: { color?: string };
  handler: (response: RazorpaySuccessResponse) => void | Promise<void>;
  modal?: { ondismiss?: () => void };
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => {
      open: () => void;
      on: (event: string, callback: (response: {
        error?: { description?: string };
      }) => void) => void;
    };
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const existing = document.getElementById("razorpay-checkout-script");
    if (existing) {
      existing.addEventListener("load", () => resolve(true), { once: true });
      existing.addEventListener("error", () => resolve(false), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = "razorpay-checkout-script";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}


const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

function formatINR(value: number) {
  return inrFormatter.format(Number.isFinite(value) ? value : 0);
}

// Clean common mojibake sequences in old cart/address text without changing stored data.
function cleanDisplayText(value: unknown): string {
  if (typeof value !== "string") return "";
  return value
    .replace(/\u00e2\u201a\u00b9/g, "\u20b9")
    .replace(/\u00c3\u2014/g, "\u00d7")
    .replace(/\u00c2\u00b7/g, "\u00b7")
    .replace(/\u00c2/g, "");
}


type Address = {
  id: number;
  label: string;
  recipient_name: string;
  phone: string;
  address_line1: string;
  address_line2?: string | null;
  landmark?: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  latitude?: number | null;
  longitude?: number | null;
  is_default: boolean;
};

export default function CheckoutPage() {
  const [message, setMessage] = useState("");
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [profile, setProfile] = useState<{ name?: string; email?: string; phone?: string | null } | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [addressError, setAddressError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const cartSnapshot = useSyncExternalStore(
    subscribeToStore,
    getCartSnapshot,
    getCartSnapshot
  );

  const items = JSON.parse(cartSnapshot) as CartItem[];
  const total = items.reduce(
    (sum, item) => sum + Number(item.price) * item.quantity,
    0
  );

  useEffect(() => {
    let cancelled = false;

    async function loadAddresses() {
      setLoadingAddresses(true);
      setAddressError("");

      try {
        const token = localStorage.getItem("visioncart_access_token");

        if (!token) {
          throw new Error("Please log in to select your delivery address.");
        }

        const response = await fetch(`${API}/api/addresses/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        });

        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(result?.detail || "Unable to load saved addresses.");
        }

        const data: Address[] = Array.isArray(result.data) ? result.data : [];

        if (!cancelled) {
          setAddresses(data);

          const defaultAddress = data.find((address) => address.is_default);
          setSelectedAddressId(defaultAddress?.id ?? data[0]?.id ?? null);
        }
      } catch (error) {
        if (!cancelled) {
          setAddressError(
            error instanceof Error ? error.message : "Unable to load addresses."
          );
        }
      } finally {
        if (!cancelled) setLoadingAddresses(false);
      }
    }

    void loadAddresses();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadProfile() {
      setLoadingProfile(true);
      try {
        const token = localStorage.getItem("visioncart_access_token");
        if (!token) throw new Error("Please log in to continue.");
        const response = await fetch(`${API}/profile`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok || !result?.data?.email) throw new Error(result?.detail || "Unable to load account contact details.");
        if (!cancelled) setProfile(result.data);
      } catch (error) {
        if (!cancelled) setAddressError(error instanceof Error ? error.message : "Unable to load account details.");
      } finally {
        if (!cancelled) setLoadingProfile(false);
      }
    }
    void loadProfile();
    return () => { cancelled = true; };
  }, []);

  const selectedAddress = addresses.find(
    (address) => address.id === selectedAddressId
  );

  async function validateDetails(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isProcessing) return;

    setMessage("");

    if (!selectedAddress) {
      setMessage("Please select a delivery address before continuing.");
      return;
    }

    const token = localStorage.getItem("visioncart_access_token");
    if (!token) {
      setMessage("Your session has expired. Please log in again.");
      return;
    }

    if (!items.length) {
      setMessage("Your cart is empty.");
      return;
    }

    setIsProcessing(true);

    try {
      const orderResponse = await fetch(`${API}/api/orders/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          address_id: selectedAddress.id,
          items: items.map((item) => ({
            product_id: item.product_id,
            quantity: item.quantity,
            selected_size: item.selectedSize || null,
            selected_color: item.selectedColor || null,
          })),
        }),
      });

      const orderResult = await orderResponse.json().catch(() => ({}));

      if (!orderResponse.ok) {
        throw new Error(
          orderResult?.detail || "Unable to create your order. Please try again."
        );
      }

      const paymentOrder = orderResult?.data;
      if (
        !paymentOrder?.razorpay_order_id ||
        !paymentOrder?.razorpay_key_id ||
        !paymentOrder?.amount
      ) {
        throw new Error("Invalid payment order response from server.");
      }

      const loaded = await loadRazorpayScript();
      if (!loaded || !window.Razorpay) {
        throw new Error("Unable to load Razorpay Checkout. Please try again.");
      }

      const checkout = new window.Razorpay({
        key: paymentOrder.razorpay_key_id,
        amount: paymentOrder.amount,
        currency: paymentOrder.currency,
        name: "VisionCart",
        description: `Order ${paymentOrder.order_number}`,
        order_id: paymentOrder.razorpay_order_id,
        prefill: {
          name: paymentOrder.customer?.name || "",
          email: profile?.email || paymentOrder.customer?.email || "",
          contact: profile?.phone || paymentOrder.customer?.phone || "",
        },
        theme: { color: "#1d4ed8" },
        handler: async (paymentResponse) => {
          setMessage("Payment received. Verifying securely...");
          try {
            const verifyResponse = await fetch(
              `${API}/api/orders/verify-payment`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  order_id: paymentOrder.order_id,
                  razorpay_order_id: paymentResponse.razorpay_order_id,
                  razorpay_payment_id: paymentResponse.razorpay_payment_id,
                  razorpay_signature: paymentResponse.razorpay_signature,
                }),
              }
            );

            const verifyResult = await verifyResponse.json().catch(() => ({}));

            if (!verifyResponse.ok || !verifyResult?.data?.verified) {
              throw new Error(
                verifyResult?.detail ||
                  "Payment verification is pending. Please contact support before retrying."
              );
            }

            writeCart([]);
            setMessage(
              `Payment successful! Your order ${verifyResult.data.order_number} is confirmed.`
            );
          } catch (error) {
            setMessage(
              error instanceof Error
                ? error.message
                : "Payment verification could not be completed. Please contact support."
            );
          } finally {
            setIsProcessing(false);
          }
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
            setMessage(
              "Payment window closed. Your cart is unchanged. You can try again."
            );
          },
        },
      });

      checkout.on("payment.failed", (response) => {
        setIsProcessing(false);
        setMessage(
          response.error?.description ||
            "Payment failed. Your cart is unchanged. Please try again."
        );
      });

      checkout.open();
    } catch (error) {
      setIsProcessing(false);
      setMessage(
        error instanceof Error ? error.message : "Unable to start payment."
      );
    }
  }

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="mx-auto max-w-6xl">
          <Link href="/cart" className="text-sm text-blue-700">
            Back to cart
          </Link>

          <div className="mt-5 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
            <section>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
                Checkout
              </p>

              <h1 className="mt-2 text-3xl font-bold">Delivery details</h1>

              <p className="mt-2 text-sm text-gray-600">
                Select where you want your order delivered.
              </p>

              {items.length === 0 ? (
                <div className="mt-6 border border-gray-200 bg-white p-6">
                  <p className="font-semibold">Your cart is empty.</p>
                  <Link
                    href="/shop"
                    className="mt-3 inline-block text-sm text-blue-700 underline"
                  >
                    Browse clothing
                  </Link>
                </div>
              ) : (
                <form
                  onSubmit={validateDetails}
                  className="mt-6 space-y-6 border border-gray-200 bg-white p-5 sm:p-7"
                >
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h2 className="text-lg font-bold">Delivery address</h2>
                        <p className="mt-1 text-sm text-gray-500">
                          Choose one of your saved addresses.
                        </p>
                      </div>

                      <Link
                        href="/account?section=addresses"
                        className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-100"
                      >
                        + Add / Manage Address
                      </Link>
                    </div>

                    {loadingAddresses ? (
                      <p className="mt-5 text-sm text-gray-500">
                        Loading your saved addresses...
                      </p>
                    ) : addressError ? (
                      <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
                        <p className="text-sm text-red-700">{addressError}</p>
                        <Link
                          href="/login"
                          className="mt-2 inline-block text-sm font-semibold text-blue-700 underline"
                        >
                          Go to login
                        </Link>
                      </div>
                    ) : addresses.length === 0 ? (
                      <div className="mt-4 rounded-lg border border-dashed border-gray-300 p-6 text-center">
                        <p className="font-semibold text-gray-800">
                          No saved delivery addresses
                        </p>
                        <p className="mt-2 text-sm text-gray-500">
                          Add an address before continuing to checkout.
                        </p>
                        <Link
                          href="/account?section=addresses"
                          className="mt-4 inline-block rounded-lg bg-blue-700 px-5 py-3 text-sm font-semibold text-white"
                        >
                          Add delivery address
                        </Link>
                      </div>
                    ) : (
                      <div className="mt-4 space-y-3">
                        {addresses.map((address) => (
                          <label
                            key={address.id}
                            className={`flex cursor-pointer gap-3 rounded-xl border p-4 transition ${
                              selectedAddressId === address.id
                                ? "border-blue-600 bg-blue-50"
                                : "border-gray-200 hover:border-gray-400"
                            }`}
                          >
                            <input
                              type="radio"
                              name="deliveryAddress"
                              value={address.id}
                              checked={selectedAddressId === address.id}
                              onChange={() => {
                                setSelectedAddressId(address.id);
                                setMessage("");
                              }}
                              className="mt-1 h-4 w-4 accent-blue-700"
                            />

                            <span className="min-w-0 flex-1">
                              <span className="flex flex-wrap items-center gap-2">
                                <strong className="text-sm">
                                  {cleanDisplayText(address.label)}
                                </strong>
                                {address.is_default && (
                                  <span className="rounded-full bg-green-100 px-2 py-1 text-[10px] font-bold text-green-700">
                                    DEFAULT
                                  </span>
                                )}
                              </span>

                              <span className="mt-2 block text-sm font-semibold text-gray-900">
                                {cleanDisplayText(address.recipient_name)}
                              </span>

                              <span className="mt-1 block text-sm leading-6 text-gray-600">
                                {cleanDisplayText(address.address_line1)}
                                {address.address_line2
                                  ? `, ${cleanDisplayText(address.address_line2)}`
                                  : ""}
                                {address.landmark
                                  ? `, ${cleanDisplayText(address.landmark)}`
                                  : ""}
                                , {cleanDisplayText(address.city)}, {cleanDisplayText(address.state)}{" "}
                                {address.postal_code}, {cleanDisplayText(address.country)}
                              </span>

                              <span className="mt-2 block text-xs text-gray-500">
                                Phone: {address.phone}
                              </span>

                              {address.latitude != null &&
                                address.longitude != null && (
                                  <span className="mt-1 block text-xs text-green-700">
                                    <a
                                      href={`https://www.openstreetmap.org/?mlat=${address.latitude}&mlon=${address.longitude}#map=17/${address.latitude}/${address.longitude}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="underline"
                                      onClick={(event) => event.stopPropagation()}
                                    >
                                      View saved map location
                                    </a>
                                  </span>
                                )}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="border-t border-gray-200 pt-5">
                    <h2 className="text-lg font-bold">Contact details</h2>

                                        <div className="mt-4 space-y-3">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Registered email</p>
                        <p className="mt-1 rounded-md border border-gray-200 bg-gray-50 px-3 py-3 text-sm text-gray-800">
                          {loadingProfile ? "Loading..." : profile?.email || "Email unavailable"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Registered mobile number</p>
                        <p className="mt-1 rounded-md border border-gray-200 bg-gray-50 px-3 py-3 text-sm text-gray-800">
                          {loadingProfile ? "Loading..." : profile?.phone || selectedAddress?.phone || "Use delivery address mobile"}
                        </p>
                      </div>
                    </div>

                  </div>

                  <button
                    type="submit"
                    disabled={
                      items.length === 0 ||
                      !selectedAddress ||
                      loadingAddresses ||
                      loadingProfile ||
                      !profile?.email ||
                      isProcessing
                    }
                    className="w-full bg-blue-700 px-5 py-3.5 font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isProcessing ? "Processing payment..." : "Pay Now"}
                  </button>

                  {message && (
                    <p
                      role="status"
                      className="border border-amber-300 bg-amber-50 p-4 text-sm leading-6 text-amber-900"
                    >
                      {message}
                    </p>
                  )}
                </form>
              )}
            </section>

            <aside className="border border-gray-200 bg-white p-5">
              <h2 className="font-semibold">Order summary</h2>

              {items.length === 0 ? (
                <p className="mt-4 text-sm text-gray-600">
                  No items to review.
                </p>
              ) : (
                <>
                  <ul className="mt-4 divide-y divide-gray-200">
                    {items.map((item) => (
                      <li
                        key={`${item.product_id}-${item.selectedSize}-${item.selectedColor}`}
                        className="flex justify-between gap-3 py-3 text-sm"
                      >
                        <span className="min-w-0">
                          {cleanDisplayText(item.name)} x {item.quantity}
                          {item.selectedSize ? ` - ${cleanDisplayText(item.selectedSize)}` : ""}
                          {item.selectedColor ? ` - ${cleanDisplayText(item.selectedColor)}` : ""}
                        </span>

                        <span className="shrink-0">
                          {formatINR(Number(item.price) * item.quantity)}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-3 flex justify-between border-t pt-4 font-bold">
                    <span>Estimated subtotal</span>
                    <span>{formatINR(total)}</span>
                  </div>

                  {selectedAddress && (
                    <div className="mt-5 border-t pt-4">
                      <h3 className="text-sm font-semibold">
                        Delivering to
                      </h3>
                      <p className="mt-2 text-sm font-medium">
                        {cleanDisplayText(selectedAddress.recipient_name)}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-gray-600">
                        {cleanDisplayText(selectedAddress.address_line1)},{" "}
                        {cleanDisplayText(selectedAddress.city)},{" "}
                        {selectedAddress.postal_code}
                      </p>
                    </div>
                  )}

                  <p className="mt-4 text-xs leading-5 text-gray-600">
                    Shipping is currently free. Payments are securely processed
                    through Razorpay.
                  </p>
                </>
              )}
            </aside>
          </div>
        </div>
      </main>
    </>
  );
}
