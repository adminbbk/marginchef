@AGENTS.md

# MarginChef

Profit per dish per channel for Dubai restaurants. **Read PLAN.md and PROGRESS.md at the start of every session; update PROGRESS.md at the end of every task.** Build phase by phase (PLAN.md §7).

## Commands

| Task                      | Command                                                                  |
| ------------------------- | ------------------------------------------------------------------------ |
| Dev server                | `npm run dev` (http://localhost:3000)                                    |
| Local Postgres (no Neon)  | `npm run db:local`, then put the printed URL in `.env` as `DATABASE_URL` |
| Migrate (dev)             | `npm run db:migrate -- --name <change>`                                  |
| Migrate (deploy)          | `npm run db:deploy`                                                      |
| Seed demo café            | `npm run db:seed` (sign in as `demo@marginchef.test`)                    |
| Lint / types / unit tests | `npm run check` (run before every commit)                                |
| Format                    | `npm run format`                                                         |
| Unit tests                | `npm test` · coverage: `npm run test:coverage`                           |
| Isolation test (needs DB) | `npm run test:integration`                                               |
| E2E (Playwright)          | `npm run test:e2e`                                                       |
| Prisma Studio             | `npm run db:studio`                                                      |

Dev sign-in: with no `AUTH_RESEND_KEY`, magic links are written to `.dev-outbox/<email>.txt` and the server log.

## Stack

Next.js 16 App Router (Middleware is now `proxy.ts`; read `node_modules/next/dist/docs/` before using unfamiliar APIs) · TypeScript strict · Tailwind v4 + shadcn/ui (base-ui flavour, `cn` from the `cn` package) · Prisma 7 with `@prisma/adapter-pg`, client generated to `lib/generated/prisma` · Auth.js v5 (`next-auth@beta`) with database sessions · Vitest · Playwright · Zod 4.

Prisma is pinned to **7.10.0**: npm's `latest` tag currently points at an 8.0 release candidate.

## Layout

```
app/                    routes; product UI lives under app/app/ (URL /app)
  login/                magic link + Google sign-in
  api/auth/[...nextauth]/
components/ui/          shadcn components
lib/
  auth/                 Auth.js config (index.ts), dev mailer
  db.ts                 RAW Prisma client: lint-restricted to lib/tenant, lib/auth, prisma/, tests/
  tenant/               tenant guard: scope.ts (pure), db.ts (Prisma extension), context.ts (getTenant), provision.ts
  margin/               (phase 1) ALL money math, pure functions, unit-tested
  generated/prisma/     generated client (gitignored)
prisma/                 schema, migrations, seed.ts
tests/integration/      DB-backed tests (tenant isolation)
e2e/                    Playwright specs (phone-380 + desktop projects)
```

## Conventions

- **Money is integer fils** (1 AED = 100 fils). Never floats. Quantities are `Decimal(12,4)`; percentages `Decimal(7,4)` stored as 28 for 28%. Round only at display time.
- **All margin math lives in `lib/margin/`.** UI and seed code never calculate profit, cost or margin themselves.
- **Tenant isolation:** app code gets data only through `const { db } = await getTenant()` (from `@/lib/tenant/context`). `db` scopes every query to the current outlet and throws on non-tenant models. Importing `@/lib/db` elsewhere is a lint error.
  - On `create`, types still require `outletId`: pass `outlet.id` from `getTenant()`. The guard refuses any other value.
  - Never use `$queryRaw`/`$executeRaw` in app code; they bypass the guard.
  - New customer-data table → add `outletId`, an `outlet` relation, `@@unique([id, outletId])` if it is referenced, composite `(xId, outletId)` foreign keys to parents, and add it to `TENANT_MODELS` in `lib/tenant/scope.ts`. The schema test fails until you do.
- `any` is a lint error. If unavoidable, disable for that line with a comment saying why.
- Mobile first: every screen must work at 380 px wide with no horizontal scroll.
- Locale: AED with 2 decimals, dates DD/MM/YYYY, week starts Monday, time zone Asia/Dubai.
- Ask before adding a paid third-party service or a new major dependency.
- Small commits with clear messages; `npm run check` must pass first.

## Gotchas

- `prisma dev` (local DB) is single-connection and fails under parallel sessions with `08P01 bind message…`. Playwright runs one worker locally for this reason; CI uses a real Postgres service.
- `next typegen` generates the `PageProps<"/route">` / `LayoutProps` globals; `npm run typecheck` runs it first.
