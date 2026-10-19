"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { AIBlock, ShoppingContext } from "@/types/ai";
import { ai, integration } from "@/lib/services";
import { isNotConnected, describeError } from "@/lib/core/errors";
import { useDocumentTitle } from "@/lib/hooks/misc";
import { cn } from "@/lib/core/utils";
import { AIBlocks } from "@/components/ai/blocks";
import { Icon } from "@/components/ui/icon";
import { Field, Input, Select } from "@/components/ui/field";

interface Msg { id: number; role: "user" | "assistant" | "error"; text?: string; blocks?: AIBlock[] }

const STARTERS = ["Wedding outfit under ₹10,000", "Complete casual look for the weekend", "Best running shoes for daily use", "Summer office wear on a budget"];
const OCCASIONS = ["Casual", "Work", "Wedding", "Party", "Festival", "Travel", "Gym"];
const STYLES = ["Minimal", "Classic", "Boho", "Streetwear", "Sporty", "Ethnic"];

function Chat() {
  useDocumentTitle("AI Stylist");
  const initial = useSearchParams().get("prompt") ?? "";
  const [input, setInput] = useState(initial);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [pending, setPending] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [ctx, setCtx] = useState<{ budgetMax: string; occasion: string; style: string; gender: string; size: string }>({ budgetMax: "", occasion: "", style: "", gender: "", size: "" });
  const nextId = useRef(1);
  const endRef = useRef<HTMLDivElement>(null);
  const connected = integration.ai.state !== "missing";

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [msgs, pending]);

  const buildContext = (): ShoppingContext => ({
    budgetMax: ctx.budgetMax ? Number(ctx.budgetMax) : undefined, occasion: ctx.occasion || undefined, style: ctx.style || undefined, gender: ctx.gender || undefined, size: ctx.size || undefined,
  });

  const send = async (text: string) => {
    const message = text.trim();
    if (!message || pending) return;
    setInput("");
    setMsgs((m) => [...m, { id: nextId.current++, role: "user", text: message }]);
    setPending(true);
    try {
      const res = await ai.chat({ conversationId, message, context: buildContext() });
      setConversationId(res.conversationId);
      setMsgs((m) => [...m, { id: nextId.current++, role: "assistant", blocks: res.blocks }]);
    } catch (e) {
      setMsgs((m) => [...m, { id: nextId.current++, role: "error", text: isNotConnected(e) ? "The AI stylist isn't connected yet, so I can't answer this right now. Your message wasn't processed." : describeError(e) }]);
    } finally { setPending(false); }
  };

  return (
    <div className="mx-auto grid max-w-[1280px] gap-6 px-4 py-6 lg:grid-cols-[320px_1fr] lg:px-8">
      <aside aria-label="Your preferences" className="space-y-4 lg:sticky lg:top-32 lg:self-start">
        <div className="rounded-3xl border border-line bg-surface p-5">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold"><Icon name="sliders" size={17} className="text-ai" />Your preferences</h2>
          <p className="mt-1 text-xs text-muted">Shared with the stylist to tailor suggestions.</p>
          <div className="mt-4 space-y-4">
            <Field label="Budget (up to ₹)" optional>{(p) => <Input {...p} inputMode="numeric" placeholder="e.g. 10000" value={ctx.budgetMax} onChange={(e) => setCtx((c) => ({ ...c, budgetMax: e.target.value.replace(/\D/g, "") }))} className="h-11" />}</Field>
            <Field label="Occasion" optional>{(p) => <Select {...p} value={ctx.occasion} onChange={(e) => setCtx((c) => ({ ...c, occasion: e.target.value }))} className="h-11"><option value="">Any</option>{OCCASIONS.map((o) => <option key={o}>{o}</option>)}</Select>}</Field>
            <Field label="Style" optional>{(p) => <Select {...p} value={ctx.style} onChange={(e) => setCtx((c) => ({ ...c, style: e.target.value }))} className="h-11"><option value="">Any</option>{STYLES.map((o) => <option key={o}>{o}</option>)}</Select>}</Field>
            <Field label="Shopping for" optional>{(p) => <Select {...p} value={ctx.gender} onChange={(e) => setCtx((c) => ({ ...c, gender: e.target.value }))} className="h-11"><option value="">Anyone</option><option>Women</option><option>Men</option><option>Kids</option></Select>}</Field>
          </div>
        </div>
        <Link href="/ai-shopping/outfit-builder" className="flex items-center gap-3 rounded-3xl border border-line bg-surface p-5 transition hover:border-ai"><span className="flex size-10 items-center justify-center rounded-full bg-ai-soft text-ai"><Icon name="layers" size={18} /></span><span><span className="block text-sm font-semibold">Outfit builder</span><span className="block text-xs text-muted">Build a look and track your budget</span></span></Link>
      </aside>

      <section className="flex min-h-[70dvh] flex-col rounded-3xl border border-line bg-surface" aria-label="AI stylist chat">
        <header className="flex items-center gap-3 border-b border-line px-5 py-4">
          <span className="flex size-10 items-center justify-center rounded-full bg-ai text-white"><Icon name="sparkles" size={18} /></span>
          <div><h1 className="font-display text-lg font-semibold leading-tight">VisionCart AI Stylist</h1>
            <p className={cn("flex items-center gap-1.5 text-xs", connected ? "text-success" : "text-warn")}><span className={cn("size-1.5 rounded-full", connected ? "bg-success" : "bg-warn")} />{connected ? "Online" : "Not connected yet"}</p></div>
        </header>

        {!connected && <div role="status" className="mx-5 mt-4 flex items-start gap-3 rounded-2xl bg-warn-soft p-4 text-sm text-warn"><Icon name="plug" size={18} className="mt-0.5 shrink-0" /><p>The stylist&apos;s backend isn&apos;t connected yet. This screen is ready, but messages won&apos;t be answered until it is.</p></div>}

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-6" aria-live="polite">
          {msgs.length === 0 && (
            <div className="mx-auto max-w-lg py-8 text-center">
              <h2 className="font-display text-2xl font-semibold">What are we dressing you for?</h2>
              <p className="mt-2 text-sm text-muted">Describe the occasion, your budget or the vibe — in your own words.</p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">{STARTERS.map((s) => <button key={s} type="button" onClick={() => send(s)} className="rounded-full border border-line-strong px-4 py-2 text-sm hover:border-ai hover:text-ai">{s}</button>)}</div>
            </div>)}
          {msgs.map((m) => m.role === "user" ? (
            <div key={m.id} className="flex justify-end"><p className="max-w-[85%] rounded-3xl rounded-br-lg bg-ink px-5 py-3 text-sm text-white">{m.text}</p></div>
          ) : m.role === "error" ? (
            <div key={m.id} role="alert" className="flex gap-3"><span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-warn-soft text-warn"><Icon name="alert" size={15} /></span><p className="max-w-[85%] rounded-3xl rounded-tl-lg bg-warn-soft px-5 py-3 text-sm text-warn">{m.text}</p></div>
          ) : (
            <div key={m.id} className="flex gap-3"><span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-ai text-white"><Icon name="sparkles" size={15} /></span><div className="min-w-0 max-w-[90%] text-sm"><AIBlocks blocks={m.blocks ?? []} onFollowup={send} /></div></div>
          ))}
          {pending && <div className="flex gap-3" role="status" aria-label="The stylist is thinking"><span className="flex size-8 items-center justify-center rounded-full bg-ai text-white"><Icon name="sparkles" size={15} /></span><div className="flex items-center gap-1.5 rounded-3xl bg-sunken px-5 py-4">{[0, 150, 300].map((d) => <span key={d} className="size-2 animate-bounce rounded-full bg-ai/60" style={{ animationDelay: `${d}ms` }} />)}</div></div>}
          <div ref={endRef} />
        </div>

        <form onSubmit={(e) => { e.preventDefault(); void send(input); }} className="border-t border-line p-4">
          <div className="flex items-end gap-2 rounded-3xl border border-line-strong bg-surface p-2 focus-within:border-ai focus-within:ring-4 focus-within:ring-ai/10">
            <label htmlFor="ai-input" className="sr-only">Message the AI stylist</label>
            <textarea id="ai-input" rows={1} value={input} onChange={(e) => setInput(e.target.value)} placeholder="e.g. Outfit for a friend's wedding under ₹8,000"
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(input); } }}
              className="max-h-40 min-h-11 flex-1 resize-none bg-transparent px-3 py-2.5 text-sm outline-none placeholder:text-faint" />
            <button type="submit" disabled={!input.trim() || pending} aria-label="Send message" className="flex size-11 shrink-0 items-center justify-center rounded-full bg-ai text-white transition hover:bg-ai-hover disabled:bg-line-strong"><Icon name="send" size={17} /></button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default function AIShoppingPage() {
  return <Suspense fallback={null}><Chat /></Suspense>;
}
