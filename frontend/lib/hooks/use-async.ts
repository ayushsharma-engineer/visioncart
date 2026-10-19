"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface Settled<T> {
  key: string;
  data?: T;
  error?: unknown;
  ok: boolean;
}

export interface AsyncState<T> {
  /** Last successful result. Kept while a newer request loads, so lists don't flash empty. */
  data: T | undefined;
  /** Error for the CURRENT key only. */
  error: unknown;
  /** True until the current key has settled. */
  loading: boolean;
  reload: () => void;
}

/**
 * Minimal data-fetching hook. `key` identifies the request: when it changes, a new
 * fetch starts and in-flight ones are aborted. `fn` always sees the latest closure.
 */
export function useAsync<T>(key: string, fn: (signal: AbortSignal) => Promise<T>): AsyncState<T> {
  const [settled, setSettled] = useState<Settled<T> | null>(null);
  const [version, setVersion] = useState(0);
  const [lastData, setLastData] = useState<T | undefined>(undefined);
  const fnRef = useRef(fn);

  useEffect(() => {
    fnRef.current = fn;
  });

  const fullKey = `${key}#${version}`;

  useEffect(() => {
    const ctrl = new AbortController();
    fnRef.current(ctrl.signal).then(
      (data) => {
        if (ctrl.signal.aborted) return;
        setSettled({ key: fullKey, data, ok: true });
        setLastData(data);
      },
      (error: unknown) => {
        if (ctrl.signal.aborted) return;
        setSettled({ key: fullKey, error, ok: false });
      },
    );
    return () => ctrl.abort();
  }, [fullKey]);

  const current = settled?.key === fullKey ? settled : null;
  const reload = useCallback(() => setVersion((v) => v + 1), []);

  return {
    data: current?.ok ? current.data : lastData,
    error: current && !current.ok ? current.error : undefined,
    loading: current === null,
    reload,
  };
}
