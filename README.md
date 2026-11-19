# Intercontinental Crest

A full stack online banking demo: checking and savings accounts, transfers, bill pay, loans, investing, crypto trading and custody wallets, statements, support chat, and an admin console.

Intercontinental Crest is a demonstration platform. It is not a bank, holds no customer money, and every balance and transaction is simulated.

## Stack

| Part | Tech |
| --- | --- |
| Web app (`frontend/`) | Next.js 16 (App Router, Turbopack), React 19, Tailwind CSS 4, Radix UI, Recharts |
| API (`backend/`) | NestJS 10, Prisma 5, PostgreSQL (Neon in production) |
| Hosting | Vercel (two projects, deployed by GitHub Actions on push to `master`) |

The browser only talks to the web app's own origin. Requests to `/api/*` are proxied to the API by a Next.js rewrite, so sessions use first party httpOnly cookies and no tokens are kept in `localStorage`.

## Run it locally

Requirements: Node.js 20.9 or newer and a PostgreSQL database.

```bash
# API
cd backend
cp ../.env.example .env        # set DATABASE_URL, DIRECT_URL, JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
npm install
npx prisma migrate deploy
npm run prisma:seed            # optional demo customer, see prisma/seed.ts
npm run build && npm run start:prod      # http://localhost:4000/api

# Web app (another terminal)
cd frontend
npm install
npm run dev                    # http://localhost:3000 (proxies /api to localhost:4000)
```

Or run everything with Docker: `cp .env.example .env`, fill it in, then `docker compose up --build`.

## Configuration

See `.env.example`. The important ones:

| Variable | Where | Purpose |
| --- | --- | --- |
| `DATABASE_URL`, `DIRECT_URL` | API | Postgres connection (pooled and direct) |
| `JWT_SECRET` | API | Signs sessions. Required in production |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | API | Super admin login, applied on every start |
| `FRONTEND_URL` | API | Base URL used in email links |
| `RESEND_API_KEY` | API | Sends email. Without it, emails go to `backend/mails/sent_mails.log` |
| `BACKEND_URL` | Web app | API origin for the `/api` proxy (set at build time) |

To change the super admin password in production, update `ADMIN_PASSWORD` in the backend's Vercel project settings and redeploy the backend.

## Tests

```bash
# API checks (139): security, transfers, loans, crypto, statements, 2FA, admin
cd backend && node --env-file=.env test/api.e2e.mjs

# Browser checks (44): every page and the main customer and admin journeys
cd frontend && BASE=http://localhost:3000 node --env-file=../backend/.env e2e/app.e2e.mjs
```

Both create throwaway customers. Run them against a local or staging database, never production.

Other checks: `npm run typecheck` and `npm run lint` in `frontend/`, `npx tsc --noEmit` in `backend/`.

## Security notes

- Passwords are hashed with bcrypt. Accounts lock for 15 minutes after 5 failed sign ins.
- Optional two factor authentication (TOTP). Access, refresh and 2FA challenge tokens are separate and cannot be swapped.
- Roles are checked by the API on every request, and the user's status and role are read fresh from the database, so suspensions apply immediately.
- Balance changes use conditional database updates, so concurrent payments cannot overdraw an account, and loans and investments can only be paid out once.
- Admin actions (balance adjustments, freezes, approvals, role changes, revaluations) are written to an audit log.
- Only the last four digits of an SSN are stored. Crypto deposit references are per customer demo identifiers that no real blockchain accepts.

## Project layout

```
backend/
  prisma/            schema, migrations, seed
  src/               NestJS modules (auth, accounts, transactions, loans, investments, crypto, wallets, kyc, support, admin, notifications)
  test/api.e2e.mjs   API checks
frontend/
  app/(marketing)/   public site
  app/(auth)/        sign in, register, password reset
  app/dashboard/     customer app
  app/admin/         admin console
  components/        UI kit, app shell, marketing sections
  e2e/app.e2e.mjs    browser checks
```
