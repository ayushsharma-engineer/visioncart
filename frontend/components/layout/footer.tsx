import Link from "next/link";
import { config } from "@/lib/config";
import { money } from "@/lib/format";
import { Brand } from "./brand";
import { Icon, type IconName } from "../ui/icon";

const TRUST: { icon: IconName; title: string; text: string }[] = [
  { icon: "truck", title: "Free delivery", text: `On orders above ${money(config.freeShippingThreshold)}` },
  { icon: "returns", title: "Easy returns", text: `${config.returnDays}-day return window` },
  { icon: "shield", title: "Secure payments", text: "Encrypted checkout" },
  { icon: "sparkles", title: "AI styling help", text: "Outfits within your budget" },
];

const COLS: { title: string; links: [string, string][] }[] = [
  { title: "Shop", links: [["All products", "/shop"], ["Deals", "/shop?sale=1&sort=discount"], ["New arrivals", "/shop?sort=newest"]] },
  { title: "AI Stylist", links: [["Ask the assistant", "/ai-shopping"], ["Outfit builder", "/ai-shopping/outfit-builder"]] },
  { title: "Your account", links: [["Sign in", "/login"], ["Orders", "/account/orders"], ["Addresses", "/account/addresses"], ["Wishlist", "/wishlist"]] },
  { title: "Sell", links: [["Seller dashboard", "/seller"]] },
];

export function Footer() {
  return (
    <footer className="mt-20 border-t border-line bg-surface pb-24 md:pb-0">
      <div className="mx-auto grid max-w-[1440px] gap-6 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
        {TRUST.map((t) => (
          <div key={t.title} className="flex items-center gap-4">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-sunken text-ink"><Icon name={t.icon} size={20} /></span>
            <div><p className="text-sm font-semibold">{t.title}</p><p className="text-xs text-muted">{t.text}</p></div>
          </div>
        ))}
      </div>
      <div className="bg-ink text-white/70">
        <div className="mx-auto grid max-w-[1440px] gap-10 px-4 py-12 lg:grid-cols-[1.4fr_repeat(4,1fr)] lg:px-8">
          <div>
            <Brand inverted />
            <p className="mt-3 max-w-xs text-sm leading-6">Fashion that fits your style, your occasion and your budget — with an AI stylist to help you put it together.</p>
          </div>
          {COLS.map((c) => (
            <nav key={c.title} aria-label={c.title}>
              <h3 className="text-sm font-semibold text-white">{c.title}</h3>
              <ul className="mt-3 space-y-2 text-sm">
                {c.links.map(([label, href]) => <li key={label}><Link href={href} className="hover:text-white">{label}</Link></li>)}
              </ul>
            </nav>
          ))}
        </div>
        <div className="border-t border-white/10 px-4 py-5 text-center text-xs">© {new Date().getFullYear()} VisionCart. All rights reserved.</div>
      </div>
    </footer>
  );
}
