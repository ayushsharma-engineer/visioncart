# VisionCart frontend

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4. No UI libraries; no new runtime dependencies were added.

> Read [`INTEGRATION.md`](./INTEGRATION.md) first. It lists what is connected to the backend, what is
> not, the backend defects that block it, and the API contracts the UI expects.

## Run it

```bash
# 1. Backend (from repo root). NOTE: see INTEGRATION.md §3, it currently needs 3 small fixes to start/log in.
#    Also needs SECRET_KEY set (config.py reads SECRET_KEY, .env defines JWT_SECRET).

# 2. Frontend
cd frontend
cp .env.example .env.local      # fixtures on for development
npm install
npm run dev                     # http://localhost:3000
```

| Command | Purpose |
|---|---|
| `npm run dev` / `build` / `start` | Standard Next.js |
| `npm test` | Unit tests for the pure logic in `lib/core` (Node's built-in runner, no extra deps) |
| `npm run typecheck`, `npm run lint` | Static checks |

The browser never calls the backend directly. `/backend/*` is proxied to `BACKEND_URL` by `next.config.ts`
(the API has no CORS). Restart `next dev` after changing `BACKEND_URL`.

## Data modes

`NEXT_PUBLIC_DATA_MODE=fixtures` gives a **read-only** sample catalog for UI work; `live` calls only real
endpoints. Fixtures are ignored in production builds. They never fake orders, payments, seller writes or AI.

## Architecture

```
app/            Routes (App Router). Pages are thin: they call services and render components.
components/
  ui/           Design-system primitives (Button, Field, Sheet, Rating, states…)
  layout/       Header, footer, mobile tab bar, search, account menu
  product/ cart/ checkout/ seller/ ai/   Feature components
  providers/    Auth + toast context, RequireAuth route guard
lib/
  core/         PURE logic (money, errors, variants, catalog query, URL state, cart). Unit-tested.
  http/client.ts  The only module that talks to the backend (envelope unwrap, 401 → refresh → retry)
  auth/         Token store + live auth service
  services/     ★ The seam between UI and data: one typed interface per domain + registry
  fixtures/     Dev-only sample catalog
  stores/       Browser-persisted cart & wishlist (useSyncExternalStore)
types/          domain.ts mirrors the DB models; ai.ts is the proposed AI contract
```

### Connect a backend domain (no page changes)

1. Implement the interface from `lib/services/types.ts`, e.g. `lib/services/orders.live.ts`, using `request()`.
2. In `lib/services/index.ts` replace the `makeUnavailable(...)` line with your implementation and update
   its entry in `integration` so the status page/banners stay truthful.
3. Money from FastAPI arrives as strings; pass it through `toNumber()` in your mapper.

## Conventions

- Next 16: `params`/`searchParams` are async on the server; client pages use `useParams`/`useSearchParams`
  (the latter needs a `<Suspense>` boundary).
- Colours are tokens in `app/globals.css` (`brand` vermilion, `ai` iris reserved for AI surfaces, ivory `canvas`).
  Base resets go in `@layer base`, because unlayered CSS beats Tailwind utilities.
- Currency/locale/shipping policy come from `lib/config.ts` (env-overridable) for international expansion.
- `AGENTS.md` / `CLAUDE.md` in this folder still apply: read `node_modules/next/dist/docs/` before using unfamiliar Next 16 APIs.
