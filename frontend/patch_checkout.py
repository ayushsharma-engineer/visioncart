from pathlib import Path
import re

path = Path("app/checkout/page.tsx")
s = path.read_text(encoding="utf-8")

# 1. Cart clearing support
old = 'import { getCartSnapshot, subscribeToStore, type CartItem } from "@/lib/store";'
new = 'import { getCartSnapshot, subscribeToStore, type CartItem, writeCart } from "@/lib/store";'
assert s.count(old) == 1, "Cart import did not match"
s = s.replace(old, new)

# 2. Razorpay types and script loader
marker = 'const API = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000").replace(/\\/$/, "");'
addition = r'''

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
'''
assert s.count(marker) == 1, "API marker did not match"
s = s.replace(marker, marker + addition)

# 3. Processing state
old = '  const [addressError, setAddressError] = useState("");'
new = old + '\n  const [isProcessing, setIsProcessing] = useState(false);'
assert s.count(old) == 1, "Address state marker did not match"
s = s.replace(old, new)

# 4. Replace validation handler with payment flow
pattern = r'  function validateDetails\(event: React\.FormEvent<HTMLFormElement>\) \{.*?\n  \}\n\n  return \('
replacement = r'''  async function validateDetails(event: React.FormEvent<HTMLFormElement>) {
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
          email: email || paymentOrder.customer?.email || "",
          contact: paymentOrder.customer?.phone || "",
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

  return ('''
s, count = re.subn(pattern, lambda _: replacement, s, count=1, flags=re.S)
assert count == 1, "Could not safely locate checkout validation handler"

# 5. Button state and label
old = '''                      items.length === 0 ||
                      !selectedAddress ||
                      loadingAddresses'''
new = '''                      items.length === 0 ||
                      !selectedAddress ||
                      loadingAddresses ||
                      isProcessing'''
assert s.count(old) == 1, "Checkout button disabled condition did not match"
s = s.replace(old, new)

old = '                    Validate delivery details'
new = '                    {isProcessing ? "Processing payment..." : "Pay Now"}'
assert s.count(old) == 1, "Checkout button label did not match"
s = s.replace(old, new)

# 6. Update payment information
old = '''                    Shipping and payment are not included. No payment will be
                    collected here.'''
new = '''                    Shipping is currently free. Payments are securely processed
                    through Razorpay.'''
assert s.count(old) == 1, "Checkout payment note did not match"
s = s.replace(old, new)

path.write_text(s, encoding="utf-8")
print("Checkout Razorpay integration patch applied successfully.")
