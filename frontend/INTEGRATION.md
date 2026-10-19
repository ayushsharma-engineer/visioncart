# VisionCart: frontend ⇄ backend integration

This document is the source of truth for **what is really connected, what is not, and what the
backend must provide next**. Nothing here is aspirational: every "works" claim was exercised
against the real FastAPI app (see [How this was verified](#how-this-was-verified)).

## 1. Status at a glance

| Area | State | Notes |
|---|---|---|
| Sign in / register / session | ✅ **Live** | `POST /api/auth/login`, `POST /users`, `POST /api/auth/logout`, `POST /api/auth/refresh`, `GET /profile` |
| Catalog, search, filters, product pages | 🟡 **Fixtures only** (dev) | No product/category endpoints exist. UI + query contract are complete. |
| Reviews (read) | 🟡 Fixtures only (dev) | Table exists, no endpoint |
| Reviews (write) | 🔴 Not connected | |
| Cart | 🟢 **Browser only** | Standard guest-cart pattern. `carts` tables have no API. |
| Wishlist | 🟢 **Browser only** | No wishlist table or API. UI says "saved on this device". |
| Addresses | 🔴 Not connected | Table exists, no endpoints. Full CRUD UI built. |
| Orders / order history / cancel | 🔴 Not connected | Tables exist, no endpoints. UI built. |
| Payments (Razorpay) | 🔴 Not connected | Keys in `.env`; no server integration. Client glue written, **untested**. |
| Seller dashboard + product CRUD | 🔴 Not connected | Tables exist, no endpoints, no way to know a user is a seller. UI built. |
| AI assistant / outfits / recommendations | 🔴 Not connected | AI modules exist server-side; none exposed over HTTP. UI + contract built. |

**Behaviour when something is not connected:** the UI says so plainly ("Orders: not available
yet"), the action fails with a `NotConnectedError`, and **nothing is fabricated**: no fake
orders, payments, AI replies or "picked for you" lists. `/dev/status` (dev only) shows this table live.

## 2. Data modes

`NEXT_PUBLIC_DATA_MODE` in `frontend/.env.local`:

- `live` (code default): only real endpoints are called; catalog is "not available yet".
- `fixtures`: a **read-only** sample catalog (11 products, 8 categories, a few reviews) so the
  storefront can be reviewed. It cannot place orders, take payments, create seller products or
  answer AI questions. A banner is always visible while it is on.
- **Fixtures are ignored in production builds** (`NODE_ENV=production`) unless
  `NEXT_PUBLIC_ALLOW_FIXTURES_IN_PRODUCTION=true` is set deliberately for a demo. Verified: a
  production build with `fixtures` requested renders zero sample products and 404s `/dev/*`.

`.env.local` is provided for convenience (fixtures on). It is git-ignored; `.env.example` is committed.

## 3. Backend defects found (all reproduced against the running app)

I made **no changes to the backend**, as requested. These block or degrade the frontend, in priority order.

1. **The app cannot start with `uvicorn app.main:app`.** Circular import: `main.py` imports
   `app.models.user` → `app.db.base`, whose last lines import every model, including `user`, which is
   still half-loaded → `ImportError`. *Fix:* in `main.py`, `import app.db.base` before any model import,
   or move the model imports out of `db/base.py` into `models/__init__.py`.
2. **Login always returns HTTP 500 with the `.env` as shipped.** `.env` / `.env.example` define
   `JWT_SECRET`, but `core/config.py` reads `SECRET_KEY` (→ `None`). *Fix:* read `JWT_SECRET`, or rename the variable.
3. **Wrong password → HTTP 500 instead of 401** (and logout with an unknown token → 500).
   `services/auth_service.py` raises `HTTPException` but never imports it (`NameError`).
   *Fix:* `from fastapi import HTTPException`, or raise `UnauthorizedException`. The frontend
   currently shows "check your email and password" for a login 500 so users aren't misled.
4. **Two tokens for one user minted in the same second collide → HTTP 500.** JWTs have only a
   second-resolution `exp` (no `jti`/`iat`), so identical tokens violate the unique
   `refresh_sessions.token_hash`. Reproduced: two logins within one second (double-click, two tabs),
   and refresh immediately after login. *Fix:* add `jti` (e.g. `uuid4().hex`) to access and refresh payloads.
5. **`GET /users` is unauthenticated and lists every user's name and email.** *Fix:* remove it or require an admin role.
6. **Registering an existing email → HTTP 500** (unhandled `IntegrityError`). *Fix:* check first and raise a 409 `AppException`.
7. **`requirement.txt` is incomplete.** Imported but missing: `fastapi`, `uvicorn`, `pyjwt`, `pwdlib[argon2]`;
   the AI modules also need `sentence-transformers` and the Google GenAI SDK.
8. **No CORS middleware.** Handled on the frontend by a same-origin proxy (`/backend/*` → `BACKEND_URL`
   in `next.config.ts`), so the backend is untouched. If you later call the API cross-origin, add CORS.
9. **Three different error shapes** (`{error:{code,message}}`, `{detail:"…"}`, Pydantic `{detail:[…]}`).
   The frontend normalises all three (unit-tested), but one consistent envelope would be cleaner.
10. *Not run, noted from reading:* `tests/test_main.py` imports `backend.app.main` while the code imports `app.*`.

## 4. Schema gaps the UI already accounts for

Optional fields in `types/domain.ts` are marked **NOT IN DB**; the UI hides them when absent.

| Gap | Impact | Suggested change |
|---|---|---|
| `order_items` has `product_id` but **no `product_variant_id`** | An order can't record the size/colour bought. **Cannot fulfil correctly.** | Add `product_variant_id` (FK), snapshot `size`, `color`, `sku` |
| No wishlist table | Wishlist can't sync across devices | `wishlist_items(user_id, product_id, created_at)` |
| `products` lacks `brand`, `compare_at_price`, gallery images | No brand filter / "% off" / multi-image | Add columns (or `product_images` table) |
| No rating aggregates | Sort-by-rating, stars on cards | `rating_average`, `review_count` (derived or stored) |
| `categories` lacks image / parent / slug | Category tiles, nested nav | Add `image_url`, `parent_id`, `slug` |
| `orders` has only `total_amount` | Delivery fee / discounts can't be itemised | Add `subtotal`, `shipping_fee`, `discount`, `currency` |
| `payments` lacks gateway ids | Can't reconcile Razorpay | `razorpay_order_id`, `razorpay_payment_id`, `razorpay_signature` |
| `users` has no role; JWT has only `user_id` | Frontend can't tell sellers from customers | `GET /me` returning `{id,name,email,roles,seller_id}` |
| `Numeric(10,2)` serialises as a **string** | `"1599.00"` breaks arithmetic | Frontend already coerces via `toNumber()`; or serialise as number |
| No currency anywhere | International expansion | Store `currency` per product/order; frontend formatting is already config-driven |

## 5. Proposed contracts (nothing below exists yet)

Each frontend domain has a typed interface in `lib/services/types.ts`. To connect one, implement it
with `request()` from `lib/http/client.ts` and swap it in `lib/services/index.ts`; **no page changes**.
The method list *is* the proposal for backend endpoints:

- **Catalog:** list categories · list products with `ProductQuery` (`q, categoryId, minPrice, maxPrice, sizes[], colors[], brands[], minRating, inStockOnly, onSaleOnly, sort, page, pageSize` → `{items,total,page,pageSize,facets}`) · product by id incl. variants · products by ids.
- **Reviews:** list by product · create (auth).
- **Addresses:** list · create · update · delete · set default (auth, scoped to user).
- **Orders:** create from `{addressId, paymentMethod, items:[{productId, variantId, quantity}]}`; **the server re-prices every line and checks stock**; the client never sends trusted prices · list mine · get · cancel.
- **Payments:** `initiate(orderId)` → `{keyId, razorpayOrderId, amount(paise), currency}` (created server-side with `RAZORPAY_KEY_SECRET`) · `verify(orderId, {razorpay_payment_id, razorpay_order_id, razorpay_signature})` (server checks the HMAC, then marks paid).
- **Seller:** get mine (`null` if none) · register · products CRUD with variants · order lines for my products.
- **AI** (`types/ai.ts`): `chat({conversationId?, message, context})` → typed blocks (`text`, `products`, `outfits`, `budget`, `followups`) + the extracted `ShoppingIntent` (mirrors `backend/app/ai/schemas/intent.py`) · `suggestOutfits({budgetMax, occasion, style, gender, anchorProductIds})` · `recommend({context, productId})`.

## 6. Security notes

- **Tokens live in `localStorage`** (the API returns them in JSON, no cookies). That is readable by any
  injected script. Hardening path: a Next route handler as a BFF that holds tokens in `httpOnly` cookies.
- Refresh tokens rotate; the client refreshes once per 401 (single-flight) and survives the cross-tab race
  where another tab already rotated the token.
- `?next=` redirects accept only same-origin paths (unit-tested against `//evil.com`, `https://…`, `/\evil.com`).
- Cart prices are a display snapshot. **Authoritative pricing and stock must come from the server at order creation.**
- Your `.env` holds real-looking keys; it is gitignored and was never committed, but if the zip was shared
  anywhere, rotate the Gemini and Razorpay keys.

## 7. What is deliberately not built

Coupons (no schema), profile/password editing (no endpoints), forgot-password, social login, image upload
(sellers paste an image URL), pincode serviceability, i18n/RTL, SSR for catalog pages (the data layer is
client-side while the catalog is fixtures; move calls server-side once the real API exists, for SEO).
The old "Google login", "email or mobile" and "forgot password" controls were removed from the login page:
the backend supports none of them and leaving them would imply they work.

## 8. How this was verified

- `npm test`: 35 unit tests (error normalisation for all 3 backend shapes, money/INR, variants, filtering/sorting/facets, URL state, cart maths, redirect safety).
- `tsc --noEmit`, `eslint`, and `next build` (21 routes) are clean.
- **Real backend:** the FastAPI app was run (SQLite, outside the repo) and every auth path above was exercised, including failures.
- **Real browser:** headless Chrome at 1366px and 390px: every route, register → reload → silent token refresh → logout (server revokes the token), cart rules, wishlist persistence, honest not-connected states, AI error state, outfit-builder budget meter, mobile drawer/sheet/tab bar, and a production server confirming fixtures are blocked.
- **Not verified:** Razorpay checkout (needs the backend), real product images (the sandbox has no internet; the fallback tiles were exercised instead), real devices/Safari.
