import { Badge, type Tone } from "./badge";

const ORDER: Record<string, [Tone, string]> = {
  pending: ["warn", "Pending"], confirmed: ["ai", "Confirmed"], processing: ["ai", "Processing"],
  shipped: ["ai", "Shipped"], delivered: ["success", "Delivered"], cancelled: ["danger", "Cancelled"],
};
const PAYMENT: Record<string, [Tone, string]> = {
  pending: ["warn", "Payment pending"], paid: ["success", "Paid"], failed: ["danger", "Payment failed"], refunded: ["neutral", "Refunded"],
};

function pick(map: Record<string, [Tone, string]>, value: string) {
  const hit = map[value.toLowerCase()];
  return hit ?? (["neutral", value.charAt(0).toUpperCase() + value.slice(1)] as [Tone, string]);
}

export function OrderStatusBadge({ status }: { status: string }) { const [t, l] = pick(ORDER, status); return <Badge tone={t}>{l}</Badge>; }
export function PaymentStatusBadge({ status }: { status: string }) { const [t, l] = pick(PAYMENT, status); return <Badge tone={t}>{l}</Badge>; }
