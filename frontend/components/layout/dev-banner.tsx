import Link from "next/link";
import { config } from "@/lib/config";
import { integration } from "@/lib/services";

/**
 * Always-visible honesty marker. Shown whenever fixtures are active, and in any development build,
 * so nobody mistakes sample data or an unconnected feature for the real thing.
 */
export function DevBanner() {
  const fixtures = config.dataMode === "fixtures";
  if (!fixtures && !config.isDev) return null;
  const missing = Object.values(integration).filter((i) => i.state === "missing").length;

  return (
    <div className="border-b border-warn/20 bg-warn-soft px-4 py-1.5 text-center text-xs text-warn">
      <strong className="font-semibold">{fixtures ? "Dev fixtures active" : "Live data mode"}</strong>
      <span className="hidden sm:inline">{fixtures ? " — sample catalog, read-only. Orders, payments, seller and AI are not faked." : " — only real backend endpoints are called."}</span>
      {" "}· {missing} not connected.{" "}
      <Link href="/dev/status" className="font-semibold underline">Integration status</Link>
    </div>
  );
}
