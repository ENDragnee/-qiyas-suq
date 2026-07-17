# Run & Test — Kiyas (qiyas-suq)

> From a **fresh clone** to a running, testable app. Covers both repos, the dev
> database, the bootstrapping problem (no admin on a fresh DB), and a manual + automated test checklist.
> Companion docs: `ARCHITECTURE.md`, `BACKEND_FIXES.md`, `PROJECT_OVERVIEW.md`, `HANDOFF.md`.

---

## 0. TL;DR (the happy path)

```bash
# 1. MongoDB (one-time, via Docker)
sg docker -c "docker run -d --name suq -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=suq -e MONGO_INITDB_ROOT_PASSWORD=qazwsxedc \
  -e MONGO_INITDB_DATABASE=suq -v suq_mongo_volume:/data/db mongo:7.0"

# 2. Backend
cd backend
cp .env.example .env            # Bun auto-loads backend/.env
bun install
DATABASE_URL='mongodb://suq:qazwsxedc@localhost:27017/suq?authSource=admin' bun scripts/seed.ts   # DEV ONLY, once
bun run dev                     # listens on :3000

# 3. Frontend (separate terminal)
cd frontend
cp .env.example .env.local
bun install
bun run dev -p 3001             # listens on :3001

# 4. Open http://localhost:3001  (log in as testuser / userpass123)
```

---

## 1. Prerequisites

| Tool | Why | Notes |
|------|-----|-------|
| **Bun** | Runs both backend (TS) and frontend (Next) | Install from https://bun.sh. The backend has **no build step** — Bun executes TS directly. `bun` is the only required JS runtime. |
| **Docker** | Local MongoDB (and optionally SeaweedFS for image upload) | The `docker/` compose file is **currently broken** (see §6), so use the plain `docker run` commands in §2. |
| **Google Chrome** (optional) | Only for the automated puppeteer e2e smoke (`frontend/scripts/e2e-smoke.ts`) | System Chrome at `/usr/bin/google-chrome` is what the script expects; the app itself needs no browser beyond the user's. |
| **Git** | Clone | — |

> No separate Node.js install is required; Bun provides the runtime for Next as well.

---

## 2. Start the stack (in order)

### 2.1 MongoDB
The dockerized Mongo creates its root user in the **`admin`** database, so the
connection string **must** use `authSource=admin` (not the code default `suq`,
which fails to authenticate — ARCHITECTURE §10 #6).

```bash
sg docker -c "docker run -d --name suq -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=suq \
  -e MONGO_INITDB_ROOT_PASSWORD=qazwsxedc \
  -e MONGO_INITDB_DATABASE=suq \
  -v suq_mongo_volume:/data/db mongo:7.0"
```
- After a reboot, restart the existing volume: `sg docker -c "docker start suq"`.
- If Mongo auth acts inconsistently, wipe, and reseed:
  `sg docker -c "docker rm -f suq"` → `docker volume rm suq_mongo_volume` → re-run §2.1 → re-run §2.3 seed.

> **SeaweedFS** (image upload) is **optional** for the core flows. The upload
> endpoint talks to a hard-coded `http://localhost:9333`. If you want image
> upload to work, start SeaweedFS (master `:9333`, volume `:8333`) from
> `docker/docker-compose.yml` or your own setup. Sales/CRUD/item-listing do not
> need it (the item form treats `image` as optional and degrades gracefully).

### 2.2 Backend (port 3000)
```bash
cd backend
cp .env.example .env          # see §3 for vars; Bun auto-loads this file
bun install
bun run dev                   # → "MongoDB Connected Successfully", listens on :3000
```
Health check: `curl http://localhost:3000/api/shop` should return a JSON shop list
(public endpoint). A `401`/connection error means Mongo isn't up or `DATABASE_URL`
is wrong.

### 2.3 Frontend (port 3001)
```bash
cd frontend
cp .env.example .env.local    # NEXT_PUBLIC_API_URL=http://localhost:3000
bun install
bun run dev -p 3001           # → Next ready on :3001
```
Open **http://localhost:3001**. (Cross-port localhost: `:3001`→`:3000` is allowed by
the backend CORS rule, with credentials.)

---

## 3. Environment variables

### Backend (`backend/.env` — copy from `backend/.env.example`)
| Var | Example | Notes |
|-----|---------|-------|
| `PORT` | `3000` | REST + GraphQL listen port. |
| `DATABASE_URL` | `mongodb://suq:qazwsxedc@localhost:27017/suq?authSource=admin` | **`authSource=admin` is required** (root user lives in `admin` db). |
| `SESSION_SECRET` | `dev-secret-change-me` | Use a strong random value in production. |
| `ROUND_SALT` | `10` | bcrypt salt rounds; app throws if missing/NaN. |
| `ENVIRONMENT` | `development` | Set `production` to hide raw error details from API responses. |

> **Where the file lives:** `src/index.ts` calls `dotenv.config({ path: "../.env" })`
> (relative to cwd), **and** Bun auto-loads `.env` from its cwd. So the simplest
> setup is `backend/.env` (Bun reads it). You can instead put it at repo root
> (`-qiyas-suq/.env`) or pass vars inline on the `bun` command (what the seed script does).

### Frontend (`frontend/.env.local` — copy from `frontend/.env.example`)
| Var | Example | Notes |
|-----|---------|-------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:3000` | Backend base URL (REST + GraphQL). Must be a `localhost`/`127.0.0.1` origin for CORS + credentialed cookies. |

---

## 4. Bootstrapping: getting the first admin / shop / user

**The problem (ARCHITECTURE §10 #13):** shops are **admin-created**, but the signup
API forces every new user to `role:"user"`. There is **no API path to create an
admin**, so on a fresh database there is no admin to create the first shop — which
blocks *everything* (no shop → no signups → nothing to test).

**The solution:** `backend/scripts/seed.ts` inserts an admin, a shop, and a regular
user directly (bypassing the API role restriction). Run it **once** against the
running Mongo, from the `backend/` directory:

```bash
cd backend
DATABASE_URL='mongodb://suq:qazwsxedc@localhost:27017/suq?authSource=admin' \
  bun scripts/seed.ts
```

It prints (and creates):
```
shop:    { id: <shopId>, name: "Seed Shop" }
admin:   { userName: "admin",   password: "adminpass123", role: "admin",   shopId: <shopId> }
user:    { userName: "testuser", password: "userpass123", role: "user",    shopId: <shopId> }
```

> **DEV ONLY.** The seed deletes & recreates these three records (upsert by
> `userName`/`name`), so re-running is safe but it will reset their passwords. Do
> **not** ship or run this against production data.

After seeding you can log in as `testuser` / `userpass123` (regular user) or
`admin` / `adminpass123` (admin) from the frontend. Additional users join via
**Sign up** using the shop's id + the shop password (`adminpass123` for "Seed Shop").

---

## 5. Manual test checklist (one line per core flow)

Log in as `testuser` / `userpass123` unless noted. "Working" = the stated outcome.

| # | Flow | How | Working looks like |
|---|------|-----|--------------------|
| 1 | **Signup (join a shop)** | `/signup`, enter name/userName/password + the shop id + shop password (`adminpass123`) | Redirected to `/dashboard`; new user appears as a member of "Seed Shop". |
| 2 | **Login** | `/login` with `testuser`/`userpass123` | Redirected to `/dashboard`; nav shows logged-in state. |
| 3 | **Shop directory (public)** | `/shops` (logged out OK) | Grid of `ShopCard`s; "Seed Shop" listed. |
| 4 | **Shop profile (public)** | `/shops/<shopId>` | Banner + name + account count; no item grid (none exists). |
| 5 | **View item (public)** | `/items/<itemId>` (logged out OK) | Image, name, price (mono), stock, description. |
| 6 | **Buy now** | On an item page while logged in → "Buy now" → set qty → Confirm | Success toast shows the sale **code**; a `Sale` is created (see §4 UX note re: status). |
| 7 | **Dashboard item CRUD** | `/dashboard` → New / edit / delete | Table lists the shop's items; create persists; edit PATCH persists (name change sticks); delete removes it (Load-more works). |
| 8 | **Admin shop CRUD (admin only)** | Log in as `admin`; `/admin/shops` → New / delete | Table of all shops; create a shop; delete removes it. A regular user hitting `/admin` is redirected away. |
| 9 | **Sales history** | `/account/sales` (as a user with a sale) | Table of the user's purchases (e.g. a `CODE1234` sale with status `success`). |
| 10 | **Password reset** | `/account/settings` → old + new password | Submit succeeds (⚠️ backend stores the new password in plaintext — ARCHITECTURE §10 #2, known/unfixed). |

> **Buy-now → history visibility:** `createSale` defaults `status:"pending"` while
> `fetchSales` defaults to `status:"success"`. A just-purchased item will **not**
> show in `/account/sales` until its status flips to `"success"` (the
> `updateSalesStatus` mutation). This is the existing design, not a regression.

---

## 6. Known infra caveats

- **`docker/docker-compose.yml` is broken:** it references a `Dockerfile` that does
  not exist, and the installed `docker-compose` v1 rejects the v2 `name:` key. Use
  the plain `docker run` in §2.1 instead of `docker compose up`.
- **Sessions are in-memory** (no Redis). Restarting the backend logs everyone out.
- **`.env` is gitignored** — commit `.env.example` only; each dev creates their own `.env`/`.env.local`.
- **`backend/.env.example` says `backend/.env` "is NOT read" in older copies — that
  comment was corrected; Bun auto-loads `backend/.env`.** Use `backend/.env`.

---

## 7. Automated checks (what a clean pass looks like)

Run these after the stack is up. They are the CI-equivalent gate for this repo.

### Backend — typecheck
The backend has **no bundler build** (Bun executes TS) and no ESLint configured.
The equivalent gate is `tsc --noEmit`:
```bash
cd backend
bun run typecheck        # = tsc --noEmit
```
**Clean pass:** exits `0` with **no `error TS` output**.

### Frontend — build + lint
```bash
cd frontend
bun run build            # next build + TypeScript type check
bun run lint             # eslint
```
**Clean pass:** `next build` prints `✓ Compiled successfully` and the route table;
`bun run lint` prints no errors (a stray unused-var warning in a dev script is not
a failure).

### End-to-end smoke (real browser)
`frontend/scripts/e2e-smoke.ts` drives headless Chrome through the core flows:
```bash
cd frontend
bun scripts/e2e-smoke.ts
```
**Clean pass (4/4):**
```
LOGIN -> redirected to /dashboard: OK
/account/sales shows real sale CODE1234: OK
EDIT PATCH persisted new name (Widget Verified): OK
ROLE GATE /admin blocks regular user: OK
```
> The smoke expects a `CODE1234` sale (status `success`) to exist for `testuser`.
> It is created during backend verification (or seed a sale manually). If it's
> missing, that one assertion will report "sale NOT found" — create the sale (e.g.
> via the Buy-now flow + flip status to `success`) and re-run.

### Quick backend request probes (no browser)
```bash
# public shop list
curl -s http://localhost:3000/api/shop | head -c 120; echo
# authenticated /me
curl -s -c /tmp/c.txt -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' -d '{"userName":"testuser","password":"userpass123"}' >/dev/null
curl -s -b /tmp/c.txt http://localhost:3000/api/auth/me | head -c 80; echo
# filtered pagination count
curl -s "http://localhost:3000/api/shop?search=zzzNoMatch" | grep -o '"count":[0-9]*'
```
Expected: a shop JSON; a `200 { "user": … }`; `"count":0`.
