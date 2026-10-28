# Progress

## Current phase: 0 — Foundation (almost done; blocked on accounts only Sam can create)

### 2026-10-03: Phase 0 build

**Done**

- [x] Next.js 16 + TypeScript strict + Tailwind v4 + shadcn/ui, ESLint, Prettier, Vitest, Playwright
- [x] Prisma schema from PLAN.md §4 + first migration (`prisma/migrations/*_init`). Additions to the plan's schema:
  - Auth.js tables (User, Account, Session, VerificationToken)
  - `outletId` on **every** customer-data table, child tables included (IngredientPrice, InvoiceLine, RecipeLine, ChannelPrice, OrderItem). Children reference parents through composite `(id, outletId)` foreign keys, so the database rejects any link to another outlet's row.
  - `Outlet.slug` (unique, for `/o/[slug]`), `Channel.commissionBase` (GROSS/NET, §5), Membership relations with `@@unique([userId, orgId])`
  - `Order @@unique([outletId, channelId, externalId])`, so re-importing a payout statement can't duplicate orders
  - Timestamps and indexes
- [x] Auth.js v5: email magic link (Resend) + Google (shown only when its env vars are set). Database sessions. Dev mailer writes links to `.dev-outbox/`.
- [x] First login creates Organization ("My restaurant"), Outlet ("Main outlet") and an OWNER Membership (`lib/tenant/provision.ts`). An advisory lock makes this safe under concurrent requests.
- [x] Tenant guard: `getTenant().db` scopes every query by outletId and fails closed. ESLint blocks the raw client in app code.
  - Unit tests (23): argument rewriting, plus a check that `TENANT_MODELS` matches every schema model with an `outletId`
  - Integration isolation test (57): every tenant model × read/count/widened filter/update/delete, nested includes, transactions, cross-outlet create, DB-level FK
  - Mutation check: with the guard disabled, 56 of 57 fail. The one that still passes is the database FK test, as intended.
- [x] Seed: Sunset Bean Café — JLT. 30 ingredients (two price points each; tomato up 18%), 20 dishes + 3 sub-recipes, 3 channels (Dine-in, Talabat 28% net, Deliveroo 30% gross + AED 1 fee), about 3,100 orders over 60 days. Deterministic and idempotent.
- [x] E2E: a signed-out visitor is redirected; a new user signs up by magic link and lands on an empty `/app` at 380 px and desktop width, with no horizontal scroll.
- [x] CI workflow (`.github/workflows/ci.yml`): lint, typecheck, format, unit tests + coverage, migrate, isolation test, E2E, all against a Postgres 16 service
- [x] CLAUDE.md, PROGRESS.md, `.env.example`

**Not done (needs Sam)**

- [ ] **Neon database**: create a project (region `me-central-1` / UAE if offered, otherwise the nearest), and put the pooled `DATABASE_URL` and direct `DIRECT_URL` in `.env`. Then run `npm run db:deploy && npm run db:seed`. Local dev currently uses `prisma dev`.
- [ ] **GitHub repo**: create one and push, so CI runs. Acceptance needs "isolation test passes in CI".
- [ ] **Vercel**: import the repo, set env vars (`DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`, `AUTH_RESEND_KEY`, `AUTH_EMAIL_FROM`, Google keys), and turn on preview deployments. Migrations: run `npm run db:deploy` in the build or as a separate step (decide once Neon branching is set up).
- [ ] **Resend**: API key and a verified sending domain, for production magic links.
- [ ] **Google OAuth**: client ID/secret with redirect `https://<domain>/api/auth/callback/google`.

**Phase 0 acceptance:** "a new user signs up, lands on an empty /app, and the isolation test passes in CI". The first half is verified locally by E2E. The isolation test passes locally and is wired into CI, but has not run in CI yet because there is no remote.

### Next: Phase 1 — Costing core

1. `lib/margin/`: unit conversion (g↔kg, ml↔l), cost per base unit with yield, recursive dish cost with cycle detection, net revenue, contribution margin, price advisor, flags. Include the burger worked example from §5 as a test.
2. Recalculation: when an ingredient price changes, update `currentCostPerBaseUnit` and every affected recipe. Run it from the seed too, since the seed currently leaves cost at 0.
3. Ingredients CRUD + CSV import + price history; recipes UI with live cost.

### Open questions

- §5: is Talabat/Deliveroo commission charged on the VAT-inclusive or exclusive price, and is VAT on commission reclaimed? The seed assumes Talabat = NET, Deliveroo = GROSS; check against real contracts.
- Invited staff: first-login provisioning currently gives every new user their own org. Phase 3/4 invitations must create the Membership before the invitee's first login.
- `currentCostPerBaseUnit` is stored as `Decimal(18,6)` fils per base unit, more precision than the 4dp quantity rule, because it is a derived rate (e.g. salt ≈ 0.25 fils/g).
