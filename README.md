# Kiyas (qiyas-suq)

A tenant-scoped shop inventory and sales tool. Kiyas is **not** an open marketplace: a
shop is created by an admin, and that shop's password doubles as a staff invite code.
Anyone who signs up under a shop manages only that shop's inventory and sees only their
own shop's items. The public surface is intentionally thin, limited to a shop directory
and look-up of a single item by id. Purchases are single-item "Buy now" — there is no cart.

## Overview

The product is built around a simple trust model:

- An **admin** creates a shop and sets its password.
- Staff **sign up** using the shop id and the shop password. The password is the invite
  mechanism — there is no separate invitation flow.
- Every signed-in user is scoped to exactly one shop. The backend filters all item and
  sale queries by `shopId`, so users never see another shop's data.
- The shop directory and individual item pages are public; everything else requires a session.

This makes Kiyas suitable for a small vendor who wants a lightweight way to list
inventory, sell items one at a time, and review what has been sold.

## Features

- Shop directory and public shop/item pages (no login required).
- Staff sign-up scoped to a shop via the shop id + shop password.
- Authenticated dashboard: create, edit, and delete items; image upload (two-step
  request-ticket then PUT).
- Buy now on an item detail page — records the sale and completes it immediately so it
  appears in the buyer's sales history and decrements stock.
- Account area: profile, sales history, and password reset.
- Admin area: create and delete shops (role-gated on the server-verified session).

## Tech stack

| Layer    | Stack                                                                |
|-----------|----------------------------------------------------------------------|
| Backend   | Bun, Express 5, Apollo GraphQL 5, Mongoose 8, MongoDB              |
| Frontend  | Next.js 16 (App Router), React 19, Tailwind 4, React Compiler     |
| Auth      | Session cookies (Passport `local` + `express-session`, in-memory)    |
| Tooling   | Bun (no bundler on the backend — it executes TypeScript directly)      |

The backend exposes a REST API under `/api/*` and a GraphQL endpoint at
`/api/graphql`. The frontend is a separate Next.js app that talks to the backend over
HTTP with credentials.

## Prerequisites

- [Bun](https://bun.sh) (the project was built and tested with Bun 1.3.x).
- A MongoDB instance (a local Docker container works fine for development).
- (Optional) SeaweedFS, only if you want to exercise image upload. Sales, CRUD, and
  authentication work without it.

## Getting started

### 1. Backend

Copy the example environment file and fill in your values:

```bash
cp backend/.env.example backend/.env
```

The backend reads `backend/.env` from its own directory. The important variables:

| Variable        | Description                                                 |
|-----------------|-------------------------------------------------------------|
| `DATABASE_URL`  | MongoDB connection string. The auth user lives in the `admin` |
|                 | database, so include `authSource=admin`.                    |
| `SESSION_SECRET`| Secret used to sign the session cookie.                       |
| `ROUND_SALT`    | bcrypt salt rounds (e.g. `10`).                              |
| `PORT`          | HTTP port for the backend (defaults to `3000`).              |

Start the backend:

```bash
cd backend
bun install
bun run dev
```

### 2. Frontend

Create `frontend/.env.local` pointing at the backend:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3000
```

Start the frontend (it runs on port 3001 so it can sit alongside the backend):

```bash
cd frontend
bun install
bun run dev -p 3001
```

Open http://localhost:3001.

### 3. Seed a development shop (optional, dev only)

The API forces every sign-up to role `user`, so on a fresh database there is no admin
to create shops. A dev-only seed script inserts an admin, a shop, and a regular user:

```bash
cd backend
DATABASE_URL='mongodb://suq:qazwsxedc@localhost:27017/suq?authSource=admin' \
  bun scripts/seed.ts
```

This creates `admin` / `adminpass123`, a shop named "Seed Shop", and
`testuser` / `userpass123`. **Do not run this against a production database** — the
script refuses to run when `ENVIRONMENT=production`.

## Scripts

Backend (`backend/`):

| Command            | Purpose                                  |
|-------------------|------------------------------------------|
| `bun run dev`     | Start the API in development mode.         |
| `bun run typecheck` | Run `tsc --noEmit` for type errors.    |

Frontend (`frontend/`):

| Command              | Purpose                                     |
|---------------------|---------------------------------------------|
| `bun run dev -p 3001` | Start the Next.js dev server on port 3001. |
| `bun run build`     | Production build.                            |
| `bun run lint`      | ESLint.                                     |

## Project structure

```
.
├── backend/            # Express + Apollo GraphQL API (Bun, TypeScript)
│   ├── src/
│   │   ├── contorllers/   # request handlers (auth, item, shop, file, sale)
│   │   ├── graphql/        # resolvers + SDL types
│   │   ├── schemas/        # Zod request schemas
│   │   ├── routes/         # REST route wiring
│   │   └── index.ts       # entry point
│   └── scripts/seed.ts    # dev-only bootstrap
└── frontend/           # Next.js 16 app (React 19, Tailwind 4)
    └── src/
        ├── app/           # routes (public, account, dashboard, admin)
        ├── components/     # UI components
        └── lib/           # API client, session, domain modules
```

## Testing

There is a Puppeteer end-to-end smoke test that drives the real UI against a running
stack (Mongo + backend + frontend):

```bash
cd frontend
bun run build            # the smoke imports the built app
bun scripts/e2e-smoke.ts
```

It covers login → dashboard, a real sale in account history, edit persistence, the
admin role gate, and a Buy-now purchase landing in sales history.

## Configuration notes

- **Cross-origin during development.** The frontend (`:3001`) and backend (`:3000`)
  are same-site (`localhost`), so credentialed cookies work with the default
  `SameSite=Lax`. A real cross-domain deployment needs `SameSite=None; Secure` on the
  session cookie — a backend change.
- **Admin authorization is enforced server-side.** Every admin mutation re-checks the
  role on the session user and returns `403` for non-admins. The frontend admin
  layout gates on the same server-verified session.

## Known limitations

These are recognized issues carried over from the backend and intentionally left for a
separate decision:

- Password reset accepts a plaintext value (no token/email flow).
- The admin "delete item" mutation actually deletes a *shop*.
- No Dockerfile is provided for the backend; the dev setup assumes a local container.
- Public item lookup has no auth check (intended for the public surface, but worth
  reviewing).
- File upload status is never updated after the upload completes.
- The item creation schema and the `Item` model have minor mismatches.
- A dead Google OAuth dependency remains in the backend.
- Some request handlers call `validate()` in a way that can clobber `req`.
- Backend `.env` and the Docker setup can diverge; keep them in sync.
- General naming debt across controllers/routes (e.g. `contorllers`, `routes`).

## License

See the repository license file for details.
