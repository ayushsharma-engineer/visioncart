import { NotConnectedError } from "../core/errors";

/**
 * Returns an object implementing interface T whose every method rejects with
 * NotConnectedError. This is how a domain with no backend endpoint behaves:
 * it fails loudly and honestly, and never fabricates data.
 */
export function makeUnavailable<T extends object>(domain: string, needs: string[]): T {
  return new Proxy({} as T, {
    get(_target, prop) {
      if (prop === "then") return undefined; // so `await service` never treats it as a thenable
      if (typeof prop === "symbol") return undefined;
      return () => Promise.reject(new NotConnectedError(domain, needs));
    },
  });
}
