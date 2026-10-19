"use client";

import { useSyncExternalStore } from "react";

/**
 * Tiny localStorage-backed external store, safe for SSR + hydration:
 * the server (and first client render) see `initial`, then React re-renders with real data.
 * Syncs across tabs via the `storage` event.
 */
export interface PersistentStore<T> {
  get(): T;
  set(next: T): void;
  update(fn: (prev: T) => T): void;
  subscribe(fn: () => void): () => void;
  use(): T;
}

export function createPersistentStore<T>(
  key: string,
  initial: T,
  sanitize: (raw: unknown) => T,
): PersistentStore<T> {
  let cache: T | undefined;
  const listeners = new Set<() => void>();
  let bound = false;

  const read = (): T => {
    if (typeof window === "undefined") return initial;
    if (cache !== undefined) return cache;
    try {
      const raw = window.localStorage.getItem(key);
      cache = raw ? sanitize(JSON.parse(raw)) : initial;
    } catch {
      cache = initial;
    }
    return cache;
  };

  const emit = () => listeners.forEach((l) => l());

  const store: PersistentStore<T> = {
    get: read,
    set(next) {
      cache = next;
      try {
        window.localStorage.setItem(key, JSON.stringify(next));
      } catch {
        /* quota / private mode: still works in memory for this session */
      }
      emit();
    },
    update(fn) {
      store.set(fn(read()));
    },
    subscribe(fn) {
      if (!bound && typeof window !== "undefined") {
        bound = true;
        window.addEventListener("storage", (e) => {
          if (e.key === key || e.key === null) {
            cache = undefined;
            emit();
          }
        });
      }
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    use() {
      return useSyncExternalStore(store.subscribe, store.get, () => initial);
    },
  };
  return store;
}
