# Backend Fixes — Kiyas (qiyas-suq)

> **Audience:** a developer who was **not** in the conversation that produced these changes.
> **Companion docs:** `ARCHITECTURE.md` (backend ground truth + all 17 known issues), `HANDOFF.md` (continuity), `RUN_AND_TEST.md` (how to run + test), `PROJECT_OVERVIEW.md` (full context).
> **Runtime:** Bun. REST at `/api/*`, GraphQL at `/api/graphql`.

---

## Context

The frontend (`FRONTEND_BUILD_GUIDE_UPDATE_1.md`) depends on four backend behaviors that were **broken or missing** when this work started. They were treated as build prerequisites. The backend owner signed off, and the following changes were applied and **each verified with a real request** against the running stack (Mongo on `:27017`, backend on `:3000`, frontend on `:3001`).

In addition to the four prerequisites, **two more backend bugs were found and fixed during verification** because they blocked features the frontend had already built:

- a **GraphQL CORS** bug that made *every* browser GraphQL call fail (curl worked, the browser rejected it), and
- the **Buy-now `createSale` shape** bug (ARCHITECTURE §10 #8) that made the purchase flow always error in the browser.

A **dev seed script** was also added to solve a bootstrapping dead-end (no admin can be created through the API, so a fresh DB has no one to create shops).

All changes are minimal — no refactoring beyond the bug being fixed.

---

## Fix 1 — GraphQL context wired to the authenticated user (ARCHITECTURE §10 #1)

**What was broken (root cause):**
`src/index.ts` mounted Apollo with
`context: async ({ req }) => req.session` — i.e. the whole `express-session` object.
But `req.session` has no top-level `id`; the authenticated user id lives at
`req.user.id` / `req.session.user.id` (Passport `deserializeUser` populates `req.user`).
Every sales resolver did `const { id: userId } = context.session;` → `userId` was
**`undefined`**. So `createSale` stored `userId: undefined` and `fetchSales` found
nothing. The entire sales feature was non-functional.

**What changed (files):**
- `src/index.ts` (GraphQL mount): `context` now returns `{ user: req.user as ContextUser | undefined }`.
- `src/types/graphql-context.d.ts`: `Context` is now `{ user?: ContextUser }` (was the raw session shape).
- `src/graphql/resolvers/create-sale.ts`, `fetch-sales.ts`, `fetch-sale.ts`, `update-sale-status.ts`: read `context.user.id` instead of `context.session.id`.

**Before → after (the context line in `index.ts`):**
```ts
// before
expressMiddleware(server, { context: async ({ req }) => req.session });

// after
expressMiddleware(server, {
  context: async ({ req }) => ({ user: req.user as ContextUser | undefined }),
});
```

**How verified:**
- `createSale` (authed) now writes the real `userId` (confirmed by a successful mutation returning the sale).
- `fetchSales` as the owner returns the owner's sales; as another user / admin it returns `totalDocuments: 0` for that user — the cross-user filter works.
- See "Fix 6" below for the end-to-end Buy-now confirmation.

---

## Fix 2 — PATCH validation no longer requires an unsent field (ARCHITECTURE §10 #3)

**What was broken (root cause):**
`patchItemSchema` and `patchShopSchema` required a top-level `user: { id, shopId }`
key. But the `validate()` middleware only supplies `{ body, query, params }` (it
parses `req.body/query/params` through the schema). The `user` key is never
present, so `validate()` always threw a Zod error → **`PATCH /api/item/:id` and
`PATCH /api/shop` returned 400 on every call.** Item/Shop editing was impossible.

**What changed (files):**
- `src/schemas/item.schema.ts` (`patchItemSchema`): removed the unsent `user` key; now
  `{ params: { id }, body: { name?, price?, stock?, image?, description? } }`.
- `src/schemas/shop.schema.ts` (`patchShopSchema`): same treatment (params `id` + optional body fields).

**Before → after (`patchItemSchema` body, conceptually):**
```ts
// before: schema required a `user` object the request never sends
z.object({ user: z.object({ id: z.string(), shopId: z.string() }), body: { ... } })

// after: only what the controller actually receives
z.object({ params: z.object({ id: z.string().regex(/^[0-9a-fA-F]{24}$/) }),
           body: z.object({ name: ..., price: ..., stock: ..., image: ..., description: ... }) })
```
(Controllers continue to scope the mutation by `req.user.shopId` / `req.user.id`, which is correct — the `user` key was redundant.)

**How verified:**
- `PATCH /api/item/:id` with a session cookie now returns **200** (was always 400).
- End-to-end: the puppeteer e2e smoke edits an item and confirms the new name persists (`EDIT PATCH persisted new name (Widget Verified): OK`).

---

## Fix 3 — Added `/api/auth/me` (new endpoint, build prerequisite)

**What was broken (root cause):**
There was **no** endpoint to check the current session server-side. The frontend
could only gate protected routes on *cookie presence* (a UX nicety, not real
authorization), and could not render correct logged-in state. The build guide
(§11) treated a minimal `/api/auth/me` as a prerequisite.

**What changed (files):**
- `src/contorllers/auth/me.ts` (new): `GetMe` returns `200 { user: req.user }` when
  `req.isAuthenticated()`, else `401 { message: "User is not logged in" }`.
- `src/routes/auth.ts`: `authRoutes.get("/api/auth/me", GetMe)`.

**Response shape (matches what `frontend/src/lib/session.ts` expects — it reads `json.user ?? json.data`):**
```
GET /api/auth/me   (with session cookie)  → 200 { "user": { _id, name, userName, role, shopId, ... } }
GET /api/auth/me   (no cookie)            → 401 { "message": "User is not logged in" }
```

**How verified:**
- With a logged-in cookie: `curl .../api/auth/me` → `200` with the user object.
- Without a cookie: `curl .../api/auth/me` → `401`.
- Frontend: protected layouts (`account`, `dashboard`, `admin`) call `getSession()`, which now performs a real `/api/auth/me` check instead of cookie-presence-only.

> **Known leak (RESOLVED — see `CHANGES_REPORT.md` Follow-up Fix 1):** the `user`
> object previously included the bcrypt `password` hash (ARCHITECTURE §10 #9). It is
> now stripped in `contorllers/auth/me.ts` (the user is converted to a plain object and
> `password` destructured out before sending), verified by a real request. `POST
> /api/auth/login` **still** returns the hash — a separate, still-out-of-scope endpoint.

---

## Fix 4 — Pagination count uses the filtered query (ARCHITECTURE §10 #5)

**What was broken (root cause):**
`GetItems` and `GetShops` called `Item.countDocuments()` / `Shop.countDocuments()`
**without** the `queryFilter`, so `metadata.count` / `totalPages` / `hasNextPage`
reflected the *whole collection*, not the filtered result. Pagination metadata was
wrong whenever a search/sort filter was active.

**What changed (files):**
- `src/contorllers/item/fetch-items.ts`: `Item.countDocuments(queryFilter)`.
- `src/contorllers/shop/fetch-shops.ts`: `Shop.countDocuments(queryFilter)`.

**Before → after:**
```ts
// before
const totalDocument = await Item.countDocuments();          // global count
// after
const totalDocument = await Item.countDocuments(queryFilter); // filtered count
```

**How verified:**
- `GET /api/shop?search=zzzNoMatch` → `"count":0` (the filter is applied; previously this returned the full collection size).
- Dashboard item table and admin shop table now compute correct `hasNextPage` for Load-more.

---

## Fix 5 — GraphQL mount uses credentialed CORS (found during verification)

**What was broken (root cause):**
The `/api/graphql` mount applied a **bare `cors()`** (the default), which returns
`Access-Control-Allow-Origin: *`. The browser rejects `*` for **credentialed**
cross-origin requests (`fetch(..., { credentials: "include" })` from `:3001` →
`:3000`), so every GraphQL call failed in the browser even though `curl` (which
ignores CORS) worked. This blocked Buy-now and sales history in the actual UI
regardless of Fixes 1 and 3.

**What changed (files):**
- `src/index.ts` (GraphQL mount): replaced the bare `cors()` with the existing
  `corsMiddleware` (the same one used globally — it reflects the `localhost` origin
  and sets `credentials: true`).

**Before → after (mount chain):**
```ts
// before
app.use("/api/graphql", cors(), express.json(), bodyParser.json(), expressMiddleware(...))

// after
app.use("/api/graphql", corsMiddleware, express.json(), bodyParser.json(), expressMiddleware(...))
```

**How verified:**
- `OPTIONS /api/graphql` with `Origin: http://localhost:3001` now returns
  `Access-Control-Allow-Origin: http://localhost:3001` (and credentialed POSTs succeed from the browser).
- The Buy-now flow and `/account/sales` render in a real browser (puppeteer e2e).

---

## Fix 6 — Buy-now `createSale` returns the correct shape (ARCHITECTURE §10 #8)

**What was broken (root cause):**
The SDL declares `CreateSale { message: String!  data: ISale }` — `message` is
**non-nullable**. But `create-sale.ts` returned the raw `Sale.create(...)`
document, which has **no `message` field** (and exposes `_id`, not `id`). GraphQL
threw *"Cannot return null for non-nullable field CreateSale.message"*, so Buy now
**always errored in the browser** and showed a failure toast — even though the sale
*was* written to the DB before the throw (a silent double-purchase risk on retry).
Sales *history* (`fetchSales`) worked because its resolver already maps `_id`→`id`
and returns `{ message, data }`.

**What changed (files):**
- `src/graphql/resolvers/create-sale.ts`: build the doc, convert with `.toObject()`,
  and return `{ message: "Sale recorded", data: { ...createSale, id: createSale._id.toString() } }` — mirroring `fetch-sales.ts`.

**Before → after:**
```ts
// before
const createSale = await Sale.create({ userId, itemId, price, quantity, code, status });
return createSale;   // no `message` field -> GraphQL null error

// after
const saleDoc = await Sale.create({ userId, itemId, price, quantity, code, status });
const createSale = saleDoc.toObject();
return {
  message: "Sale recorded",
  data: { ...createSale, id: createSale._id.toString() },
};
```

**How verified:**
- Real authed `createSale` GraphQL mutation now returns
  `{"createSale":{"message":"Sale recorded","data":{"id":"…","itemId":"…","price":19.99,"quantity":2,"code":"testcode1","status":"pending"}}}` with **no error**.
- The frontend `ItemDetailPanel` buy-now modal reads `data.code` for its success toast, so the flow now completes instead of failing.

> **Deliberate UX note (not a bug, not changed):** `createSale` defaults
> `status:"pending"` while `fetchSales` defaults to `status:"success"`, so a freshly
> purchased item does **not** appear in `/account/sales` until something flips its
> status to `"success"` (the `updateSalesStatus` mutation, which also decrements
> stock). This is the existing design; change defaults only after a deliberate
> product decision.

---

## Dev seed script (bootstrapping fix, not a code bug)

**Problem:** Shops are admin-created, but the signup API forces `role:"user"`, so
**no admin can ever be created through the API** (ARCHITECTURE §10 #13). On a fresh
DB there is no admin to create shops, which blocks testing/signup entirely.

**Solution:** `backend/scripts/seed.ts` inserts an admin user + a shop + a regular
user directly (bypassing the API role restriction). Run from `backend/` with the
same `DATABASE_URL`:
```bash
DATABASE_URL='mongodb://suq:qazwsxedc@localhost:27017/suq?authSource=admin' \
  bun scripts/seed.ts
```
Creates `admin` / `adminpass123` (role `admin`), shop "Seed Shop", and `testuser` /
`userpass123` (role `user`, same shop). See `RUN_AND_TEST.md` for usage.

**Status:** DEV ONLY. Delete or guard before any production deploy.

---

## Out-of-scope §10 items intentionally left as-is

These were known but explicitly **not** part of this work (verified present, not changed):
- #2 plaintext password reset, #4 `DeleteItemAdmin` deletes a *Shop*, #7 missing Dockerfile,
  #10 `GetItem` has no auth check, #11 `File.status` never updated, #12 `createItemSchema` vs
  model mismatch, #13 no admin API (seed solves it), #14 dead Google OAuth dependency, #15
  `validate()` clobbers `req`, #16 docker/.env divergence, #17 naming debt.

> **Note:** §10 #9 (`/api/auth/me` leaks the password hash) was **resolved afterward** in
> `CHANGES_REPORT.md` Follow-up Fix 1 — it is no longer open at both `/api/auth/me` and `POST /api/auth/login` (the latter fixed in
> `CHANGES_REPORT.md` Follow-up Fix 4 — §10 #9 is now fully closed).

---

## Verification summary

| Fix | Check | Result |
|-----|-------|--------|
| 1 GraphQL context | `createSale` writes real `userId`; `fetchSales` filters by user | ✅ |
| 2 PATCH validation | `PATCH /api/item/:id` returns 200 (was 400) | ✅ |
| 3 `/api/auth/me` | `200 {user}` authed, `401` unauthenticated | ✅ |
| 4 Pagination count | `GET /api/shop?search=zzzNoMatch` → `count:0` | ✅ |
| 5 GraphQL CORS | `OPTIONS /api/graphql` → `Allow-Origin: http://localhost:3001` | ✅ |
| 6 Buy-now shape | authed `createSale` returns `{ message, data }` (no null error) | ✅ |

Plus: backend `bun run typecheck` (`tsc --noEmit`) → **0 errors**; frontend puppeteer e2e smoke → **4/4 pass** (login→dashboard, `/account/sales` real sale, edit PATCH persists, `/admin` blocks regular user).
