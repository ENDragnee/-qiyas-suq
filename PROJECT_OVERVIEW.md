# Project Overview — Kiyas (qiyas-suq)

> **Audience:** you (the stakeholder/lead), with **no prior conversation**. This is a
> dense, complete technical + product rundown so you can sanity-check the whole
> project without reading the chat history.
> Companion docs: `ARCHITECTURE.md` (backend minutiae + 17 known bugs),
> `FRONTEND_BUILD_GUIDE_UPDATE_1.md` (UI spec that was actually built),
> `BACKEND_FIXES.md` (the fixes applied), `RUN_AND_TEST.md` (run + test),
> `HANDOFF.md` (continuity), `NOTES.md` (deviations log).

---

## 1. What the product is, and who it's for

**Kiyas / qiyas-suq is a tenant-scoped shop inventory & sales tool — not an open
marketplace.** (The name pairs _qiyas_ "comparison" with _suq_ "market," which
originally suggested a comparison marketplace, but the backend does not support
that, and the scope was deliberately narrowed.)

Concretely:

- A **shop** is a tenant. It is created by an **admin**, and its `password` acts as
  a **staff invite code**.
- A user **signs up by knowing a specific shop's id + that shop's password**
  ("join a shop"), and is then scoped to **that one shop**.
- After login, a user sees and manages **only their own shop's items**. There is
  **no** endpoint to list another shop's items and **no** all-items public endpoint.
- The public surface is intentionally thin: a **shop directory** and a **single
  item by id**.
- Purchases are **single-item "Buy now"** — there is **no cart** and no
  multi-item order (the `Sale` model has no order-grouping concept).

**Who it's for:** a shop's staff/owner managing inventory and recording sales from
a back-office-style dashboard (the design language is a dense, ledger-like internal
tool, not a consumer storefront).

**Why it's scoped this way (the decisive facts):** `GET /api/item` requires a
session and returns only `req.user.shopId`'s items; there is no per-shop or
all-items public endpoint; signup is gated by shop id + password. Cross-shop
browsing and a cart are therefore impossible to build honestly against the current
backend, and were cut. See §10 for the full list of cuts and why?

---

## 2. Tech stack

### Backend (`backend/`)

| Concern          | Choice                                                                  |
| ---------------- | ----------------------------------------------------------------------- |
| Runtime          | **Bun** (executes TS directly — no bundler build)                       |
| HTTP             | **Express 5**                                                           |
| GraphQL          | **Apollo Server 5** via `@as-integrations/express4` (sales domain only) |
| Database         | **MongoDB** via **Mongoose 8**                                          |
| Auth             | **Passport `local`** + `express-session` (session-cookie, **no JWT**)   |
| Sessions         | `express-session`, **in-memory** (lost on restart; no Redis)            |
| Password hashing | `bcrypt` 6                                                              |
| Validation       | `zod` 4                                                                 |
| Object storage   | **SeaweedFS** (S3-style, native REST API; master hard-coded `:9333`)    |
| CORS             | `cors` 2.8 (localhost-only, credentialed)                               |
| Config           | `dotenv` 17 (loads `../.env`; Bun also auto-loads cwd `.env`)           |

### Frontend (`frontend/`)

| Concern   | Choice                                        |
| --------- | --------------------------------------------- |
| Framework | **Next.js 16.2.10** (App Router)              |
| UI        | **React 19.2.4**                              |
| Styling   | **Tailwind CSS 4** (`@tailwindcss/postcss`)   |
| Compiler  | **React Compiler** enabled (`next.config.ts`) |
| Language  | **TypeScript 5**                              |
| Lint      | ESLint 9 + `eslint-config-next`               |
| e2e       | `puppeteer-core` + system Chrome (dev only)   |

> **Next.js 16 breaking changes:** the agent rules (`frontend/CLAUDE.md`) require
> reading `node_modules/next/dist/docs/` before coding. Notably, `middleware.ts`
> is deprecated in favor of `proxy.ts` (it still works; see §9).

---

## 3. Data models (Mongoose)

All collections use `{ timestamps: true }` (`createdAt`, `updatedAt`).

**User** (`users`): `name` (req), `userName` (req, **unique**), `password` (req, bcrypt hash), `role: "user"|"admin"` (req, default `"user"`), `shopId` (ObjectId → Shop, not required at schema level).

**Shop** (`shops`): `name` (req), `accounts: string[]` (req), `password` (req, bcrypt hash — the tenant invite key), `banner` (opt, default `""`).

**Item** (`items`): `name` (req), `price` (req, number), `stock` (req, number), `image` (opt), `description` (opt), `shopId` (ObjectId → Shop, not required at schema level; controllers always set it).

**Sale** (`sales`): `userId` (ObjectId → User, req), `itemId` (ObjectId → Item, req), `price` (req), `quantity` (req), `code` (req), `status: "pending"|"canceled"|"success"|"failed"` (req, default `"pending"`).

**File** (`files`): `fid` (req, SeaweedFS id), `name` (req), `mimeType` (enum jpeg/png/gif/pdf, req), `size` (req), `uploadedBy` (ObjectId → User, req), `status: "pending"|"failed"|"uploaded"` (req, default `"pending"`, **never flipped to `uploaded`** — §10 #11).

**Relationships:** Sale→User, Sale→Item, User→Shop, Item→Shop (loose), File→User. No DB cascades.

---

## 4. Complete API surface

Base: backend on `:3000`. REST under `/api/*`, GraphQL at `/api/graphql`. All JSON.
Errors generally return `{ status:"fail", errors:[...] }` (validation) or
`{ message, data? }`.

### 4.1 REST — Auth (`routes/auth.ts`)

| Method | Path                       | Auth    | Notes                                                                                                                                                                                                                                            |
| ------ | -------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| POST   | `/api/auth/signup`         | None    | Body: `name`, `userName`, `password`, `role` (validated but **ignored** — forced `"user"`), `shop:{ shopId, password }`. Verifies the shop + shop password, creates a `user`. Returns `201 { message, data: newUser }`. **Leaks password hash.** |
| POST   | `/api/auth/login`          | None    | Fields exactly `userName` + `password`. `200 { message:"User loged in", user }` + sets `connect.sid` cookie.                                                                                                                                     |
| POST   | `/api/auth/logout`         | None    | `req.logout()` then `res.redirect("/")`.                                                                                                                                                                                                         |
| PATCH  | `/api/auth/reset-password` | Session | `oldPassword` → `findByIdAndUpdate(userId,{password:newPassword})`. ⚠️ **Stores new password in plaintext** (§10 #2).                                                                                                                            |
| GET    | `/api/auth/me`             | Session | **Added by a fix.** `200 { user }` if authenticated, else `401`. Shape matches the frontend's `getSession()`. ⚠️ **Leaks password hash** (§10 #9).                                                                                               |

### 4.2 REST — Shops (`routes/shop.ts`)

| Method | Path                  | Auth              | Notes                                                                                                   |
| ------ | --------------------- | ----------------- | ------------------------------------------------------------------------------------------------------- |
| GET    | `/api/shop`           | **None (public)** | Paginated/searchable/sortable; strips `password`. `metadata.count` now uses the filtered query (fixed). |
| GET    | `/api/shop/:id`       | **None (public)** | Single shop; strips `password`.                                                                         |
| POST   | `/api/shop`           | **admin**         | Creates shop. ⚠️ Returns shop **with hashed password**.                                                 |
| DELETE | `/api/admin/shop/:id` | **admin**         | Deletes shop. `204`.                                                                                    |
| DELETE | `/api/shop`           | Session           | Deletes the caller's own shop (`req.user.id`). `204`.                                                   |
| PATCH  | `/api/shop`           | Session           | Updates own shop. ⚠️ Was always 400 (required an unsent `user` key) — **fixed**.                        |

### 4.3 REST — Items (`routes/item.ts`)

| Method | Path                  | Auth              | Notes                                                                                             |
| ------ | --------------------- | ----------------- | ------------------------------------------------------------------------------------------------- |
| GET    | `/api/item`           | Session           | Lists **caller's shop** items; paginated/searchable.                                              |
| GET    | `/api/item/:id`       | **None (public)** | Single item. ⚠️ No auth check (§10 #10).                                                          |
| POST   | `/api/item`           | Session           | Creates item under `req.user.shopId`.                                                             |
| DELETE | `/api/item/:id`       | Session           | Deletes item owned by caller's shop. `204`.                                                       |
| DELETE | `/api/admin/item/:id` | **admin**         | ⚠️ **BUG: deletes a Shop, not an item** (§10 #4). No admin delete-item UI exists because of this. |
| PATCH  | `/api/item/:id`       | Session           | Updates item owned by caller's shop. ⚠️ Was always 400 — **fixed**.                               |

### 4.4 REST — Files (`routes/file.ts`)

| Method | Path                              | Auth    | Notes                                                                                                                                                                      |
| ------ | --------------------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| POST   | `/api/file/upload/request-ticket` | Session | Body `name`, `mimeType` (enum), `size`. Asks SeaweedFS master for `fid`+`publicUrl`, creates a `File` record (`status:"pending"`), returns `{ uploadUrl, fid, dbResult }`. |
| DELETE | `/api/file/:fid`                  | Session | Looks up file by `fid`+`uploadedBy`, `DELETE`s on the SeaweedFS volume, removes DB record. `200`.                                                                          |

> **Upload flow (2-step):** `POST request-ticket` → client **PUTs bytes** to the
> returned `uploadUrl`. The DB `File.status` is **never flipped to `uploaded`**
> (§10 #11). The item form treats `image` as optional and degrades gracefully if
> SeaweedFS isn't running.

### 4.5 GraphQL — Sales (`/api/graphql`)

SDL domain = **Sales only**. Context is the authenticated `req.user` (fixed).
| Operation | Auth | Behavior |
|-----------|------|----------|
| `Query.fetchSales(page, limit, search, sortBy, order, status="success")` | session user | Sales for the session user, filtered by `status` (default `"success"`), paginated. Returns `{ data:[ISale], metadata }`. |
| `Query.fetchSale(saleId)` | session user | Single sale. |
| `Mutation.createSale(itemId, price, quantity, status="pending", code)` | session user | Creates a `Sale` with `userId` from session. **Fixed:** returns `{ message, data }` with `id` mapped from `_id` (§10 #8). |
| `Mutation.updateSalesStatus(saleId, status="failed")` | session user | Sets sale status. If it becomes `"success"`, decrements `Item.stock` by `quantity` (only if `stock >= quantity`). ⚠️ Response field is misspelled `staus` (§10 #8 typo). |

> **`ISale` shape:** `id` (mapped from `_id`), `itemId`, `price`, `quantity`, `code`, `status`. The frontend `Sale` type mirrors the Mongoose models (`frontend/src/types/index.ts`).

---

## 5. Authentication mechanism

- **Strategy:** `passport-local`, `usernameField:"userName"`, `passwordField:"password"`.
- `serializeUser` stores `user.id`; `deserializeUser` does `User.findById(id)` → populates `req.user`.
- **Session:** `express-session`, `secret: Bun.env.SESSION_SECRET`, `resave:false`, `saveUninitialized:false`, cookie `maxAge:1h`, `secure:false`, **HttpOnly**, `SameSite=Lax`. **In-memory only** — restarts log everyone out.
- **CORS:** `credentials:true`, origin allowed only if it starts with `http://localhost:` or `http://127.0.0.1:` (or is absent). The frontend runs on `:3001`; cross-port localhost calls are allowed. (A real cross-domain deploy needs `SameSite=None; Secure` + an explicit origin allow-list.)
- **Frontend gating:** `middleware.ts` checks cookie presence for `/account/*`, `/dashboard/*`, `/admin/*`; each protected layout also calls `getSession()`, which does a **real `/api/auth/me` check** (cookie-presence is only a fallback if the endpoint is unreachable). `admin` routes additionally check `role === "admin"`.
- **Signup model:** a user can only register if they know a valid shop id + that shop's password. New users are always `role:"user"` — **admins can only be created by the dev seed script** (no API path).

---

## 6. Folder structure

### Backend (`backend/`)

```
backend/
├── package.json            # scripts: dev (bun ./src/index.ts), typecheck (tsc --noEmit)
├── tsconfig.json           # strict; paths @/* -> src/*; types:["bun"]
├── .env.example            # PORT, DATABASE_URL, SESSION_SECRET, ROUND_SALT, ENVIRONMENT
├── src/
│   ├── index.ts            # ENTRY: Express + Apollo; middleware chain; GraphQL mount
│   ├── auth/passport-local.ts
│   ├── contorllers/        # NOTE misspelling kept on purpose (imports depend on it)
│   │   ├── auth/{signup,reset-password,me}.ts
│   │   ├── file/{upload,delete-file}.ts
│   │   ├── item/{create-item,fetch-items,fetch-item,patch-item,delete-item,delete-item-admin}.ts
│   │   └── shop/{create-shop,fetch-shops,fetch-shop,patch-shop,delete-shop,delete-shop-admin}.ts
│   ├── graphql/{types/index.ts, resolvers/*.ts}
│   ├── libs/{mongoose,password-utils}.ts
│   ├── middleware/{cors,express-json,session,passport,validate}.ts
│   ├── models/{user,shop,item,sale,file}.ts
│   ├── routes/{router,auth,shop,item,file}.ts
│   ├── schemas/{user,shop,item,sale,file}.schema.ts
│   └── types/{index.d,express-session.d,graphql-context.d}.ts
└── scripts/seed.ts         # DEV ONLY: bootstrap admin + shop + user
```

### Frontend (`frontend/`)

```
frontend/
├── package.json            # dev (-p 3001), build, start, lint
├── next.config.ts          # reactCompiler: true
├── .env.example            # NEXT_PUBLIC_API_URL=http://localhost:3000
├── .env.local              # (gitignored) created from .env.example
└── src/
    ├── app/
    │   ├── layout.tsx, globals.css, page.tsx        # root + landing
    │   ├── login/page.tsx, signup/page.tsx
    │   ├── shops/page.tsx, shops/[shopId]/page.tsx
    │   ├── items/[itemId]/page.tsx
    │   ├── account/{layout,page,sales/page,settings/page}.tsx
    │   ├── dashboard/{layout,page,items/new/page,items/[itemId]/edit/page}.tsx
    │   ├── admin/{layout,page,shops/page,shops/new/page}.tsx
    │   ├── style-guide/page.tsx                     # DEV ONLY (placeholder in prod)
    │   └── middleware.ts                            # cookie-presence gate (deprecated convention)
    ├── components/
    │   ├── ui/        # Button, Input, Select, Textarea, Badge, Modal, Toast,
    │   │              # Skeleton, EmptyState, DataTable, PriceTag, field
    │   ├── shop/      # ShopCard, ItemDetailPanel, (BuyNowModal inline in panel)
    │   ├── site-nav.tsx
    │   ├── account/sales-table.tsx
    │   ├── admin/{shop-form,shop-table}.tsx
    │   └── dashboard/{item-form,item-table}.tsx
    ├── lib/
    │   ├── api/       # client.ts, auth.ts, shops.ts, shops.client.ts, items.ts,
    │   │              # items.server.ts, files.ts, sales.graphql.ts
    │   ├── session.ts # serverApiFetch (cookie forwarding) + getSession()
    │   └── user-store.ts  # kiyas_user cookie (shopId from login, client-side)
    ├── types/index.ts     # User, Shop, Item, Sale, File (+ envelopes)
    └── scripts/e2e-smoke.ts  # DEV ONLY puppeteer smoke
```

---

## 7. Design system

**Direction:** a shop-facing inventory/sales tool — density, scanability, speed over
decoration. Personality lives in one disciplined choice: **prices, stock counts, and
sale codes are always mono and right-aligned in tables**, so inventory reads like a
ledger (reinforces "qiyas" = measurement at the data level). Dark mode is deferred
but the CSS-variable structure supports it.

### Tokens (`globals.css`, Tailwind v4 `@theme`)

- Surfaces: `--color-background #F7F4EE`, `--color-surface #FFFFFF`, `--color-surface-sunken #EFEBE2`.
- Text: `--color-foreground #1F2421`, `--color-muted #6B7570`, `--color-text-inverse #F7F4EE`.
- Brand: `--color-primary #0E5C53`, `--color-primary-hover #0B463F`, `--color-primary-tint #E4EFEC`.
- Accent (primary CTAs: Save, Buy now): `--color-accent #E8A33D`, `--color-accent-hover #CE8B29`, `--color-accent-tint #FBF0DC`.
- Semantic: success `#2F8F5B`, error `#C1442D`, warning `#C97C0A` (+ tints).
- Borders: `--color-border #E1DBCC`, `--color-border-strong #C9C1AC`.
- Dark chrome: `--color-ink #0B2422`, `--color-ink-elevated #123A36`.
- Radius: sm 6px, md 10px, lg 16px. Elevation: flat (borders) except modals/dropdowns.
- (Note: the guide's original `--color-text`/`--color-bg` were renamed to
  `--color-foreground`/`--color-background` so Tailwind generates `text-foreground`/
  `bg-background`. All other token names kept verbatim.)

### Typography

- **Display — Fraunces** (variable): page headings only.
- **Body/UI — Inter** (variable): nav, buttons, forms, table content.
- **Numerals — IBM Plex Mono**: prices, stock, sale codes, quantities (the deliberate ledger detail).
- Sizes: display 2rem/Fraunces 500; title 1.25rem/Inter 600; body 1rem; body-sm 0.875rem; caption 0.75rem/uppercase; num 0.9375rem/IBM Plex Mono 600; num-lg 1.5rem.

### Component library (`components/ui/`)

`Button` (primary/accent/secondary/ghost/destructive, loading keeps width),
`Input`/`Select`/`Textarea` (44px min height, label above, error below),
`Badge` (status/stock, always paired with text), `Modal` (focus trap, used for
buy-now + destructive confirms), `Toast` (polite live region), `Skeleton` (static
pulse), `EmptyState` (icon + Fraunces headline + line + one action), `DataTable`
(sortable, mono right-aligned numeric columns), `PriceTag` (mono price wrapper).
`Field` is the shared label/error wrapper.

---

## 8. Every page / route and what it does

| Route                            | Auth    | What it does                                                                                                       |
| -------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------ |
| `/`                              | public  | Landing: what Kiyas is, "Sign in" + "Join a shop" CTAs.                                                            |
| `/shops`                         | public  | Shop directory grid (`ShopCard`: banner, name, account count\*).                                                   |
| `/shops/[shopId]`                | public  | Shop profile: banner, name, account count; **no item grid** (none exists) + a plain note.                          |
| `/items/[itemId]`                | public  | Single item: image, name, price (mono lg), stock, description. Logged-in → Buy-now; logged-out → "Sign in to buy". |
| `/login`                         | public  | `userName`+`password` → redirect to `next` or `/dashboard`.                                                        |
| `/signup`                        | public  | "Join a shop": name, userName, password, then shop id + shop password.                                             |
| `/account`                       | session | Profile: name, username, shop, role.                                                                               |
| `/account/sales`                 | session | Sales history table (real data; was a "temporarily unavailable" banner before the fix).                            |
| `/account/settings`              | session | Password reset form (old + new).                                                                                   |
| `/dashboard`                     | session | This shop's item `DataTable` (name, price, stock, status, edit/delete; Load-more).                                 |
| `/dashboard/items/new`           | session | Create item form (shared `ItemForm`); optional image via 2-step upload.                                            |
| `/dashboard/items/[itemId]/edit` | session | Edit item form; PATCH now persists (was always 400 before the fix).                                                |
| `/admin`                         | admin   | Admin landing (role-gated layout).                                                                                 |
| `/admin/shops`                   | admin   | All-shops `DataTable` + Load-more + delete-confirm.                                                                |
| `/admin/shops/new`               | admin   | Create shop form (`ShopForm`; `accounts` comma-separated → string[]).                                              |
| `/style-guide`                   | —       | **Dev-only** design-system preview; renders a placeholder in production.                                           |

\* `ShopCard` shows **account count**, not item count — the backend has no item-count
field and no per-shop items endpoint (NOTES deviation #3).

---

## 9. Known limitations & deliberately cut scope

**Cut (and why):**

- **No cart / no multi-item checkout.** `Sale` has no order-grouping; cross-shop
  browsing was also removed, leaving no discovery flow to build a cart from. Purchases
  are single-item "Buy now" (final for v1).
- **No cross-shop browsing / per-shop public item listings.** `GET /api/item` is
  scoped to the caller's shop; there is no all-items or per-shop public endpoint.
  So `/browse`, a Compare Tray, `ProductCard`, and per-shop item grids were cut.
- **No `/seller/*`.** Merged into `/dashboard`.
- **No admin delete-item control.** `DELETE /api/admin/item/:id` deletes a _Shop_
  (§10 #4), so the UI omits it entirely.
- **Dark mode.** Deferred (token structure supports it).
- **`middleware.ts` → `proxy.ts`.** Next 16 deprecates the middleware convention;
  works today, migrate when convenient.

**Limitations / bugs left in place (intentionally out of scope for this work):**

- **Buy-now → sales-history visibility (UX default, not a bug):** `createSale`
  defaults `status:"pending"`; `fetchSales` defaults `status:"success"`. A just-
  purchased item won't show in `/account/sales` until status flips to `"success"`
  (the `updateSalesStatus` mutation, which also decrements stock). Decide deliberately
  before changing defaults.
- **§10 #2** password reset stores plaintext. **#4** `DeleteItemAdmin` deletes a Shop.
  **#7** missing Dockerfile (compose broken). **#9** `/api/auth/me` leaks password hash.
  **#10** `GetItem` has no auth check. **#11** `File.status` never updated. **#12**
  `createItemSchema` vs model mismatch. **#13** no admin API (seed solves it). **#14**
  dead Google OAuth dependency. **#15** `validate()` clobbers `req`. **#16** docker/.env
  divergence. **#17** naming/typo debt (incl. GraphQL `staus` typo).

**Infra caveats:** sessions in-memory (restart = logout); `docker-compose.yml` is
broken (use plain `docker run`); `.env` gitignored; `SEAWEED_MASTER` hard-coded;
`SESSION_SECRET` defaults to `""`; `DATABASE_URL` ships with hardcoded dev creds.

---

## 10. Current state (as of 2026-07-15)

- **All 9 frontend build-guide steps complete.** `next build` + `eslint` pass.
- **Backend prerequisite fixes applied + verified:** GraphQL context (#1), PATCH
  validation (#3), `/api/auth/me` (new), pagination count (#5) — plus a GraphQL CORS
  fix and the Buy-now `createSale` shape fix (#8). Backend `tsc --noEmit` clean.
- **Frontend un-gated:** `/account/sales` shows real data, edit PATCH persists, route
  protection uses a real `/api/auth/me` check.
- **Dev seed script** solves the no-admin bootstrapping problem.
- **e2e smoke: 4/4 pass.** See `RUN_AND_TEST.md` and `BACKEND_FIXES.md` for evidence.
- **One open product decision:** the Buy-now `pending` vs Sales-history `success`
  status default (§9). Everything else is either done or intentionally out of scope.

---

## 11. Quick mental model

```
Browser ──(session cookie, credentials)──▶ Next.js :3001 ──fetch──▶ Express :3000
                                                │                        │
                                          server components        REST /api/*   (identity, shops, items, files)
                                          forward cookie              │
                                                                       └── Apollo /api/graphql (sales only)
                                          Mongo (shops/items/sales/users/files)
                                          SeaweedFS (images, :9333/:8333, optional)
```

One auth model (Passport session cookie) across REST + GraphQL. REST = everything
except sales; GraphQL = sales only. Each shop is an isolated tenant; the frontend
never sees another shop's inventory.
