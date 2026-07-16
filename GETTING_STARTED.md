# Getting Started — Kiyas (qiyas-suq)

> **For someone who has never seen this project, has no tools installed, and knows
> nothing about how it works.** This document is fully self-contained — you can
> follow it top to bottom with zero prior context. Other `.md` files in the repo
> go deeper; they are listed only at the very end, for reference.
>
> Every command below was executed against a **freshly wiped database and a clean
> stack** on **2026-07-16** (Ubuntu 24.04.4 LTS, Bun 1.3.14, Docker 29.1.3,
> Next.js 16.2.10, Chrome at `/usr/bin/google-chrome`). What you see as "expected
> output" is what actually came back.

---

## What this app is (read this first)

**Kiyas (qiyas-suq) is a tenant-scoped shop inventory & sales tool** — think of it as
a back-office dashboard where the staff of one shop manage that shop's products and
record sales. It is **not** a public shopping site and **not** a cross-shop marketplace.

The one mental model that explains everything:

```
Browser ──(session cookie)──▶ Next.js frontend :3001 ──fetch──▶ Express backend :3000
                                                        │                  │
                                              server components     REST /api/*   (auth, shops, items, files)
                                              forward cookie         │
                                                                      └─ Apollo /api/graphql (sales only)
                                                MongoDB (shops/items/sales/users/files)
```

- A **shop** is a tenant, created by an **admin**. Its password acts as a **staff invite code**.
- You **sign up by knowing a shop's id + that shop's password** ("join a shop").
- After login you see **only your own shop's items**. There is no way to browse other shops.
- Purchases are **single-item "Buy now"** — there is **no cart**.
- The public surface is intentionally thin: a **shop directory** and **one item by id**.

Two processes run: a **backend** (Bun + Express + Apollo GraphQL + MongoDB) on port
**3000**, and a **frontend** (Next.js) on port **3001**. They talk over `localhost`.

---

# Part 1 — Environment setup from absolute zero

Do these in order. Each step tells you how to confirm it worked.

> **Path note:** in this environment the project already lives at
> `/home/tri/Desktop/Projects/Web/Kiyas/-qiyas-suq`. On a different machine, clone your
> repository and `cd` into it. The rest of Part 1 assumes your shell is sitting at the
> repo root (the folder that contains `backend/` and `frontend/`).

## Step 1 — Install Bun (the only JS runtime you need)

Both the backend and the frontend run on **Bun**. Node.js is **not** required
(the frontend's Next.js runs under Bun too).

```bash
curl -fsSL https://bun.sh/install | bash
```

The installer drops Bun at `~/.bun/bin/bun` and appends it to your `~/.bashrc`.
**Open a new terminal** (or run `source ~/.bashrc`) so `bun` is on your `PATH`, then:

```bash
bun --version
# expected: 1.3.14   (any recent 1.x is fine)
```

If `bun: command not found` persists, use the full path: `~/.bun/bin/bun`.

## Step 2 — Install & start Docker (for MongoDB)

The app needs MongoDB. The easiest path is Docker.

```bash
# only if Docker is not already installed (Ubuntu/Debian):
sudo apt-get update && sudo apt-get install -y docker.io
sudo usermod -aG docker $USER      # let your user run docker without sudo
# then LOG OUT and LOG BACK IN so the group membership takes effect
```

Confirm:

```bash
docker --version
# expected: Docker version 29.1.3 (or similar)
```

> In this environment Docker is **already installed** and your user (`tri`) is already
> in the `docker` group, so `docker` works directly. If you ever get a *permission denied*
> error, re-run the docker command prefixed with `sg docker -c "…"` (e.g.
> `sg docker -c "docker ps"`). Both forms are shown below.

## Step 3 — Start MongoDB via Docker

The repo's `docker/docker-compose.yml` is **broken** (it references a Dockerfile that
doesn't exist), so **do not use `docker compose up`**. Start Mongo directly:

```bash
docker run -d --name suq -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=suq \
  -e MONGO_INITDB_ROOT_PASSWORD=qazwsxedc \
  -e MONGO_INITDB_DATABASE=suq \
  -v suq_mongo_volume:/data/db mongo:7.0
```

Confirm it is accepting connections (look for `Waiting for connections`):

```bash
docker logs suq 2>&1 | grep -i "Waiting for connections"
# expected (something like):
# {"…","msg":"Waiting for connections","attr":{"port":27017,"ssl":"off"}}
```

> **Why these exact values:** the Mongo root user is named `suq` with password
> `qazwsxedc`, and it is created in the **`admin`** database. The backend must therefore
> connect with `authSource=admin` (not the default). This is already baked into the
> `.env` file in the next step — just don't change it.
>
> **Restarting later (after a reboot):** the data volume persists, so just
> `docker start suq`. To wipe everything and start over, see Part 3 "Reset to a clean state".

### Optional — image upload (SeaweedFS)

Uploading product images uses a separate service (SeaweedFS) on `:9333`/`:8333`. It is
**not needed** for signup, login, item CRUD, or sales — the item form treats the image
as optional and degrades gracefully if SeaweedFS isn't running. **Skip it for now.** (If
you do want it, start it from `docker/docker-compose.yml`'s seaweedfs service, or your
own setup; the upload endpoint talks to a hard-coded `http://localhost:9333`.)

## Step 4 — System Chrome (optional, e2e only)

Only needed if you want to run the automated browser smoke test (`frontend/scripts/e2e-smoke.ts`).
It is **already present** at `/usr/bin/google-chrome` in this environment. To install
elsewhere:

```bash
# Debian/Ubuntu — either of these:
sudo apt-get install -y chromium-browser          # Chromium
# or, for official Chrome: download google-chrome-stable from google.com/chrome
```

## Step 5 — Get the code & install dependencies

```bash
cd /home/tri/Desktop/Projects/Web/Kiyas/-qiyas-suq   # this environment
# on a fresh machine instead:  git clone <your-repo-url> && cd qiyas-suq

# backend dependencies
cd backend && bun install
# expected: a list of added packages, ending without errors

# frontend dependencies (new terminal, or cd back to root first)
cd ../frontend && bun install
# expected: "Saved X nodes" / a lockfile update, no errors
```

## Step 6 — Create the environment files

Both apps need a small env file, copied from the committed example. **Use the exact
paths below** (the backend specifically reads `backend/.env`).

### Backend — `backend/.env`

```bash
cd backend
cp .env.example .env
```

The file now contains:

```bash
PORT=3000
DATABASE_URL=mongodb://suq:qazwsxedc@localhost:27017/suq?authSource=admin
SESSION_SECRET=dev-secret-change-me
ROUND_SALT=10
ENVIRONMENT=development
```

| Variable | Example value | What it does |
|----------|---------------|--------------|
| `PORT` | `3000` | The port the backend listens on (REST + GraphQL). |
| `DATABASE_URL` | `mongodb://suq:qazwsxedc@localhost:27017/suq?authSource=admin` | How to reach Mongo. `authSource=admin` is **required** (the root user lives in the `admin` db). |
| `SESSION_SECRET` | `dev-secret-change-me` | Secret that signs the session cookie. Use a strong random value in production. |
| `ROUND_SALT` | `10` | bcrypt cost factor for password hashing. The app throws if this is missing. |
| `ENVIRONMENT` | `development` | Set to `production` to hide raw error details from API responses. |

### Frontend — `frontend/.env.local`

```bash
cd ../frontend
cp .env.example .env.local
```

The file now contains:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3000
```

| Variable | Example value | What it does |
|----------|---------------|--------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:3000` | Base URL of the backend (REST + GraphQL). Must be a `localhost`/`127.0.0.1` origin so CORS + credentialed cookies work in dev. |

> **Start the backend from inside `backend/`** (as shown in Step 7). Bun auto-loads
> `backend/.env` from its current directory; if you launch it from elsewhere the env
> won't load and Mongo auth will fail. (You'll see an `injected env (0)` line in the
> backend log — that's the older dotenv loader; the Bun loader still picks up
> `backend/.env`, which is why the connection succeeds.)

## Step 7 — Seed the database (creates admin + shop + user)

On a brand-new database there is **no admin**, and the signup API only ever creates
regular users — so you must bootstrap one via a dev seed script. Run it **from the
`backend/` directory**:

```bash
cd backend
DATABASE_URL='mongodb://suq:qazwsxedc@localhost:27017/suq?authSource=admin' \
  bun scripts/seed.ts
```

Expected output (the `shop.id` value is **random every run** — copy yours):

```json
MongoDB Connected Successfully
{
  "shop": {
    "id": "6a581093bc03c2cf1bb6cabd",
    "name": "Seed Shop"
  },
  "admin": {
    "userName": "admin",
    "password": "adminpass123",
    "role": "admin",
    "shopId": "6a581093bc03c2cf1bb6cabd"
  },
  "user": {
    "userName": "testuser",
    "password": "userpass123",
    "role": "user",
    "shopId": "6a581093bc03c2cf1bb6cabd"
  }
}
```

What it created (memorize these — you'll log in with them in Part 2):

| Account | Username | Password | Role |
|---------|----------|----------|------|
| Shop owner / admin | `admin` | `adminpass123` | `admin` |
| Regular staff | `testuser` | `userpass123` | `user` |
| **Shop invite** (used at signup) | Shop name: **Seed Shop**<br>Shop password: **`adminpass123`** | — | — |

> The **shop id** (`6a581093…` above) is what you type when **signing up a new user**.
> It's printed here, and it's also visible any time on the `/shops` page. The **shop
> password** for joining "Seed Shop" is `adminpass123` (same as the admin's password).
>
> ⚠️ **DEV ONLY.** The seed wipes and recreates these three records. Never run it against
> production (it refuses automatically if `ENVIRONMENT=production`).

## Step 8 — Start the stack (backend, then frontend)

Use **two terminals**. Order matters: backend first.

### Terminal 1 — backend (port 3000)

```bash
cd backend
bun run dev
```

Expected (within a second or two):

```
$ bun ./src/index.ts
MongoDB Connected Successfully
```

It is now listening on `:3000`. Confirm from a third terminal:

```bash
curl -s http://localhost:3000/api/shop | head -c 200; echo
# expected: JSON containing "Seed Shop" and "count":1
```

### Terminal 2 — frontend (port 3001)

```bash
cd frontend
bun run dev -p 3001
```

Expected (within a couple seconds):

```
▲ Next.js 16.2.10 (Turbopack)
- Local:         http://localhost:3001
- Environments: .env.local
✓ Ready in 495ms
```

Confirm:

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3001/
# expected: 200
```

## Step 9 — "Everything is running" checklist

Tick these 4 off before moving on:

1. **Mongo up:** `docker ps --format '{{.Names}} {{.Status}}'` shows `suq Up …`.
2. **Backend health:** `curl -s http://localhost:3000/api/shop` returns JSON with `"name":"Seed Shop"` and `"count":1`.
3. **Login works:** `curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3000/api/auth/login -H 'Content-Type: application/json' -d '{"userName":"testuser","password":"userpass123"}'` → `200`.
4. **Frontend serves:** open **http://localhost:3001** in a browser → you see the "Kiyas" landing page with **Sign in** and **Join a shop** buttons; visiting **http://localhost:3001/shops** shows the **Seed Shop** card.

If any of these fail, see Part 3 ("Where to look if something doesn't work").

---

# Part 2 — Full manual walkthrough (do this in order)

This is a literal QA script. For each step: **what to click/type**, the **URL you land
on**, what **correct** looks like, and what would mean **something's wrong**. Log in as
**`testuser` / `userpass123`** unless told otherwise. (Those credentials were created by
the seed in Part 1 Step 7.)

---

### 1. Open the app fresh (logged out)

- **Go to:** http://localhost:3001/
- **What you see:** the landing page — a short description of Kiyas, a **Sign in** button,
  and a **Join a shop** button. No inventory, no dashboard.
- **Try without an account:** visit http://localhost:3001/shops — you see a grid with the
  **Seed Shop** card (this directory is public). Click it → the shop profile page (banner,
  name, account count). Note there is **no product list** here by design.
- ✅ **Correct:** landing + public shop directory render with no login.
- ❌ **Wrong:** any redirect to `/login` when visiting `/` or `/shops`; a 500 page.

---

### 2. Sign up (join the seeded shop)

- **Go to:** http://localhost:3001/signup
- **Type:**
  - **Name:** `New Person`
  - **Username:** `newperson`  *(must be unique; pick any name not already used)*
  - **Password:** `newpass123`  *(≥ 8 chars)*
  - **Shop invite** section:
    - **Shop ID:** paste the **shop id** from the seed output in Part 1 Step 7
      (e.g. `6a581093bc03c2cf1bb6cabd`), **or** open http://localhost:3001/shops,
      click **Seed Shop**, and copy the id from the URL bar (`/shops/<this-id>`).
    - **Shop password:** `adminpass123`
- **Click:** **Create account** (or **Sign up**).
- **Lands on:** http://localhost:3001/dashboard
- ✅ **Correct:** redirected to `/dashboard` showing **"Your items"** (empty state on
  first signup).
- ❌ **Wrong:**
  - *"invalid shop password"* / *"shop not found"* → the Shop ID or Shop password is
    wrong. Re-copy the id from `/shops`; the password is `adminpass123`.
  - Redirect loop or 401 → you're likely not passing the shop invite fields.

> You just created a **second** staff member of "Seed Shop". (The seed's `testuser` is
> also a member; either works for the rest of this walkthrough. We'll keep using
> `testuser` below for consistency, but your `newperson` account behaves identically.)

---

### 3. Log in

- **Go to:** http://localhost:3001/login
- **Type:** **Username** `testuser`, **Password** `userpass123`.
- **Click:** **Sign in**.
- **Lands on:** http://localhost:3001/dashboard (or the page you were sent to via `?next=`).
- ✅ **Correct:** redirected to `/dashboard`.
- ❌ **Wrong:** *"invalid credentials"* → wrong password (should be `userpass123`); or the
  backend isn't running (check Terminal 1).

---

### 4. Shop directory & a shop profile

- **Go to:** http://localhost:3001/shops → grid of `ShopCard`s; **Seed Shop** is listed.
- **Click** the **Seed Shop** card → http://localhost:3001/shops/<shopId>
- **What you see:** the shop banner, name, and **account count** (how many members).
  A plain note says item listings aren't available here (by design — there's no public
  per-shop product list).
- ✅ **Correct:** profile renders; no crash.
- ❌ **Wrong:** a 404 or a stack trace → the shop id in the URL is malformed (must be a
  24-character hex string).

---

### 5. View a single item page (logged out vs logged in)

You need an item to view. If you haven't created one yet, jump to **Step 6** first, then
come back. (To get an item's id: open `/dashboard`, click an item's **Edit**, and copy the
id from the URL `/dashboard/items/<itemId>/edit`.)

- **Logged OUT:** visit http://localhost:3001/items/<itemId> in a private/incognito window
  (or after logging out). You see the image, name, **price** (large mono number), **stock**,
  and description — but the action is **"Sign in to buy"** linking to `/login`.
- **Logged IN** (your normal window): the same page instead shows a **quantity stepper**
  and a **Buy now** button (amber).
- ✅ **Correct:** price/stock visible either way; "Buy now" appears only when authenticated.
- ❌ **Wrong:** logged-out users see "Buy now" (they shouldn't); or the page 404s (bad id).

---

### 6. Dashboard — create a new item (with & without image)

- **Go to:** http://localhost:3001/dashboard → click **New item** (or visit
  http://localhost:3001/dashboard/items/new).
- **Type:**
  - **Name:** `Verified Widget`
  - **Price:** `9.99`
  - **Stock:** `10`
  - **Description:** `A sample product for testing.`
  - **Image:** *optional* — leave blank for the no-image path; or click **Choose image**
    and pick a small JPG/PNG to try the upload path.
- **Click:** **Create item** (or **Save**).
- **Lands on:** http://localhost:3001/dashboard — the new row **Verified Widget** appears
  in the table with price `9.99` and stock `10`.
- ✅ **Correct (no image):** item is created and listed; image column is empty/placeholder.
- ✅ **Correct (with image):** the form requests an upload ticket, PUTs the bytes to
  SeaweedFS, and the item is created with the image attached. **If SeaweedFS isn't running**
  (the normal case in this setup), the upload fails gracefully and the item is still
  created **without** an image — this is expected, not a bug.
- ❌ **Wrong:**
  - A 400 with *"shopId … undefined"* → shouldn't happen via the UI (the form auto-fills
    `shopId` from your session). If you see it, the app failed to read your session; log
    out and back in.
  - Stuck on the form with no redirect → check the backend Terminal 1 log for a validation
    error.

---

### 7. Edit that item

- **On** http://localhost:3001/dashboard, find **Verified Widget**, click its **Edit**.
  (URL: `/dashboard/items/<itemId>/edit`.)
- **Change** the **Name** to `Verified Widget (edited)`.
- **Click:** **Save**.
- **Lands on:** http://localhost:3001/dashboard — the row now reads
  **Verified Widget (edited)**.
- ✅ **Correct:** the new name persisted (the table shows it).
- ❌ **Wrong:** the name reverts, or you get a 400 → the edit endpoint is broken (it should
  be fixed; if not, see Part 3).

---

### 8. Buy the item via Buy now — and confirm it worked

- **Go to:** http://localhost:3001/items/<itemId> (logged in).
- **Set quantity** with the stepper (e.g. **2**).
- **Click:** **Buy now** → a confirmation modal opens showing the item, quantity, unit
  price, and a computed **total** (clearly labeled an estimate).
- **Click:** **Confirm purchase**.
- ✅ **Correct — three independent proofs it worked:**
  1. A **success toast** appears: **`Purchase recorded — code <8-char-code>`** (the code is
     auto-generated; you never type it). Example: `code a1b2c3d4`.
  2. **Stock decremented:** re-open the item page or `/dashboard` — stock went from `10` to
     `8` (you bought quantity `2`). Buy-now marks the sale `"success"` immediately, which is
     what decrements stock.
  3. The purchase shows in **sales history** (next step).
- ❌ **Wrong:**
  - Error toast / "failed" → likely insufficient stock, or the backend isn't reachable.
  - Stock did **not** change → the sale wasn't completed; check the backend log.
  - Redirect to `/login` → your session expired (sessions are in-memory; restarting the
    backend logs everyone out — just log in again).

---

### 9. Confirm the purchase in /account/sales

- **Go to:** http://localhost:3001/account/sales
- **What you see:** a table of **your** purchases. The row from Step 8 is there, showing
  the **code** (e.g. `a1b2c3d4`), **quantity** `2`, and **status** `success`.
- ✅ **Correct:** the just-made purchase is visible with status `success`.
- ❌ **Wrong:** the purchase is missing → it only appears because Buy-now marked it
  `"success"` (Step 8). If it's absent, the buy didn't complete; redo Step 8.

---

### 10. Log out

- **Click** **Log out** (in the nav).
- **Lands on:** http://localhost:3001/ (or `/login`). Your session cookie is cleared.
- ✅ **Correct:** visiting http://localhost:3001/dashboard now redirects you to `/login`.
- ❌ **Wrong:** you can still reach `/dashboard` after logging out → the session wasn't
  cleared (rare; restart both servers).

---

### 11. Log in as the admin & manage shops

- **Log in** at http://localhost:3001/login as **`admin` / `adminpass123`**.
- **Go to:** http://localhost:3001/admin/shops
  - Because you logged in as an admin, the admin area is available. (A regular user is
    bounced — see Step 12.)
- **Table** lists all shops, including **Seed Shop**.
- **Create a shop:** click **New shop** → fill:
  - **Name:** `Second Shop`
  - **Accounts:** `admin` (comma-separated list of usernames; at least one)
  - **Password:** `shoppass123` (this becomes the invite code for that shop)
  - **Click** **Create shop** → the new row **Second Shop** appears in the table.
- **Delete a shop:** click the **delete** action on **Second Shop** → confirm in the modal →
  the row disappears (`204 No Content` on the API).
- ✅ **Correct:** create and delete both reflect immediately in the table.
- ❌ **Wrong:** you can't reach `/admin/shops` at all → you didn't log in as `admin` (the
  role comes from the account, set by the seed). Log out and back in as `admin`.

---

### 12. Confirm something that should be blocked (role gate)

- **As the regular user `testuser`** (log out of admin, log in as `testuser`):
  - Visit http://localhost:3001/admin (or `/admin/shops`) directly.
  - **Result:** you are **redirected to http://localhost:3001/dashboard** — the admin area
    is blocked for non-admins.
- **Logged out entirely:**
  - Visit http://localhost:3001/admin → redirected to
    http://localhost:3001/login?next=%2Fadmin.
- ✅ **Correct blocked behavior:** non-admins and anonymous visitors are bounced away from
  `/admin/*` (regular user → `/dashboard`; logged-out → `/login`).
- ❌ **Wrong:** a non-admin actually sees the `/admin` page → the role gate failed (it
  shouldn't).

---

# Part 3 — Quick reference

## Every route

| Route | Login required? | What it does |
|-------|-----------------|--------------|
| `/` | No | Landing page: what Kiyas is, **Sign in** + **Join a shop**. |
| `/shops` | No | Public shop directory grid (`ShopCard`: banner, name, account count). |
| `/shops/[shopId]` | No | Shop profile: banner, name, account count; **no item grid** (none exists) + a plain note. |
| `/items/[itemId]` | No | Single item: image, name, price (mono), stock, description. Logged-in → **Buy now**; logged-out → **Sign in to buy**. |
| `/login` | No | `userName` + `password` → redirect to `next` or `/dashboard`. |
| `/signup` | No | "Join a shop": name, userName, password, then **shop id** + **shop password**. |
| `/account` | Yes | Your profile: name, username, shop, role. |
| `/account/sales` | Yes | Your purchase history table (real data). |
| `/account/settings` | Yes | Password reset form (old + new). |
| `/dashboard` | Yes | This shop's item table (name, price, stock, status, edit/delete; Load-more). |
| `/dashboard/items/new` | Yes | Create-item form (shared); optional image via 2-step upload. |
| `/dashboard/items/[itemId]/edit` | Yes | Edit-item form; saves via PATCH (persists). |
| `/admin` | **Admin only** | Admin landing (role-gated layout). |
| `/admin/shops` | **Admin only** | All-shops table + Load-more + delete-confirm. |
| `/admin/shops/new` | **Admin only** | Create-shop form (`accounts` comma-separated → string[]). |
| `/style-guide` | — | **Dev only** design-system preview; renders a placeholder in production. |

## Seeded test accounts (from Part 1 Step 7)

| Username | Password | Role | Used for |
|----------|----------|------|----------|
| `admin` | `adminpass123` | `admin` | Admin area (`/admin/*`), creating shops. |
| `testuser` | `userpass123` | `user` | Normal staff flow (dashboard, buy, sales). |
| — Shop **Seed Shop** | invite password `adminpass123` | — | The shop id + this password are what you type at **signup**. |

> The **shop id** is printed by the seed and also visible on `/shops`. The shop invite
> password is `adminpass123`.

## Reset to a clean state (start over)

If you want a completely fresh database (e.g. to re-run Part 1 from scratch):

```bash
# 1. stop the apps (Ctrl-C in their terminals), then stop & wipe Mongo:
docker rm -f suq
docker volume rm suq_mongo_volume

# 2. start Mongo again:
docker run -d --name suq -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=suq \
  -e MONGO_INITDB_ROOT_PASSWORD=qazwsxedc \
  -e MONGO_INITDB_DATABASE=suq \
  -v suq_mongo_volume:/data/db mongo:7.0

# 3. re-seed (from backend/):
cd backend
DATABASE_URL='mongodb://suq:qazwsxedc@localhost:27017/suq?authSource=admin' bun scripts/seed.ts

# 4. restart backend (Terminal 1) and frontend (Terminal 2) as in Part 1 Step 8.
```

You do **not** need to reinstall dependencies or recreate `.env` files — only the database
is wiped. (To wipe everything including your created items/test accounts but keep the seed
accounts, just re-run the seed; it upserts admin/testuser and recreates "Seed Shop".)

## Where to look if something doesn't work

| Symptom | Most useful doc |
|---------|-----------------|
| How to run / test / the manual checklist | `RUN_AND_TEST.md` |
| Backend API contract, data models, the 17 known backend issues | `ARCHITECTURE.md` |
| Deviations the frontend build made from the spec, live verification log | `NOTES.md` |
| The backend fixes that were applied (GraphQL auth, PATCH, CORS, buy-now, etc.) | `BACKEND_FIXES.md`, `CHANGES_REPORT.md` |
| Continuity / "what was the last agent doing" | `HANDOFF.md` |
| Full product + technical overview (the big picture) | `PROJECT_OVERVIEW.md` |

## Known quirks you'll notice (all harmless in dev)

- **Signup / create-shop responses include the password hash** in the JSON. This is a known
  dev-only leak (ARCHITECTURE §10 #9); it does **not** affect the session cookie or login.
  The `/api/auth/me` and `/api/auth/login` responses have been fixed to strip it.
- **Sessions are in-memory.** Restarting the backend logs everyone out — just log in again.
- **Item image upload needs SeaweedFS** (optional service). Without it, items are created
  fine with no image.
- **The automated e2e smoke** (`frontend/scripts/e2e-smoke.ts`, puppeteer + Chrome) is a
  *regression* check pinned to a previously-seeded item id and a `CODE1234` sale — it is
  **not** a fresh-state setup test. After a DB wipe + reseed it needs that data present to
  pass 5/5. The manual walkthrough above is the authoritative fresh-state check.
- **Buy-now marks the sale `"success"` immediately.** That's why stock decrements at purchase
  time and why the purchase shows up in `/account/sales` right away.
