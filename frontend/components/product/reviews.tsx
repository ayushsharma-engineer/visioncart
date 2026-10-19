"use client";

import { useState } from "react";
import Link from "next/link";
import type { ID, Review } from "@/types/domain";
import { reviews as reviewService } from "@/lib/services";
import { useAsync } from "@/lib/hooks/use-async";
import { describeError, isNotConnected } from "@/lib/core/errors";
import { formatDate, pluralize } from "@/lib/core/utils";
import { useAuth } from "../providers/auth";
import { useToast } from "../providers/toast";
import { Stars, RatingInput } from "../ui/rating";
import { Button } from "../ui/button";
import { Textarea, Field } from "../ui/field";
import { Skeleton } from "../ui/skeleton";
import { AsyncError } from "../ui/states";

function ReviewForm({ productId, onDone }: { productId: ID; onDone: () => void }) {
  const toast = useToast();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating < 1) { setErr("Please choose a star rating."); return; }
    setErr(null); setBusy(true);
    try {
      await reviewService.create(productId, { rating, comment: comment.trim() });
      toast.success("Thanks for your review!");
      setRating(0); setComment(""); onDone();
    } catch (ex) {
      // Not-connected is expected today: say so plainly instead of pretending it saved.
      setErr(isNotConnected(ex) ? "Reviews can't be submitted yet — this feature isn't connected to the server." : describeError(ex));
    } finally { setBusy(false); }
  };

  return (
    <form onSubmit={submit} className="space-y-4 rounded-2xl border border-line bg-surface p-5" noValidate>
      <h3 className="font-display text-lg font-semibold">Write a review</h3>
      <RatingInput value={rating} onChange={setRating} />
      <Field label="Your review" optional>{(p) => <Textarea {...p} value={comment} onChange={(e) => setComment(e.target.value)} maxLength={1000} placeholder="How was the fit, fabric and quality?" />}</Field>
      {err && <p role="alert" className="text-sm text-danger">{err}</p>}
      <Button type="submit" variant="dark" loading={busy}>Submit review</Button>
    </form>
  );
}

export function Reviews({ productId, fallbackAverage, fallbackCount }: { productId: ID; fallbackAverage?: number | null; fallbackCount?: number }) {
  const { status } = useAuth();
  const { data, error, loading, reload } = useAsync(`reviews:${productId}`, (s) => reviewService.list(productId, { signal: s }));

  const list: Review[] = (data ?? []).filter((r) => r.status === "active");
  const average = list.length ? list.reduce((s, r) => s + r.rating, 0) / list.length : fallbackAverage ?? 0;
  const count = fallbackCount ?? list.length;

  return (
    <section id="reviews" aria-labelledby="reviews-h" className="scroll-mt-32">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 id="reviews-h" className="font-display text-2xl font-semibold">Customer reviews</h2>
        {average > 0 && <div className="flex items-center gap-2"><Stars value={average} size={18} /><span className="text-sm font-semibold">{average.toFixed(1)}</span><span className="text-sm text-muted">· {pluralize(count, "rating")}</span></div>}
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_380px]">
        <div>
          {loading && !data ? <div className="space-y-4"><Skeleton className="h-20" /><Skeleton className="h-20" /></div>
            : error ? <AsyncError error={error} onRetry={reload} />
            : list.length === 0 ? <p className="rounded-2xl bg-sunken px-5 py-8 text-center text-sm text-muted">No reviews yet. Be the first to share your thoughts.</p>
            : <ul className="divide-y divide-line">{list.map((r) => (
                <li key={r.id} className="py-5 first:pt-0">
                  <div className="flex items-center gap-3"><Stars value={r.rating} size={14} /><span className="text-sm font-semibold">{r.author_name ?? "VisionCart customer"}</span><span className="text-xs text-muted">{formatDate(r.created_at)}</span></div>
                  {r.comment && <p className="mt-2 text-sm leading-6 text-ink-soft">{r.comment}</p>}
                </li>))}</ul>}
        </div>
        <div>
          {status === "authenticated" ? <ReviewForm productId={productId} onDone={reload} /> : (
            <div className="rounded-2xl border border-line bg-surface p-5 text-sm"><p className="font-medium">Share your experience</p><p className="mt-1 text-muted">Sign in to write a review.</p>
              <Link href={`/login?next=${encodeURIComponent(`/product/${productId}`)}`} className="mt-3 inline-block font-semibold text-brand underline">Sign in</Link></div>)}
        </div>
      </div>
    </section>
  );
}
