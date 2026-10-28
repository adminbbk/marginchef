# MarginChef

True profit for every dish on every sales channel (dine-in, Talabat, Deliveroo, Careem, Keeta, Noon, direct) for independent Dubai restaurants. Profit is calculated after commission, packaging and 5% VAT.

- Product and build plan: [PLAN.md](PLAN.md)
- Status: [PROGRESS.md](PROGRESS.md)
- Commands and conventions: [CLAUDE.md](CLAUDE.md)

## Quick start

```bash
npm install
cp .env.example .env        # fill DATABASE_URL (Neon) and AUTH_SECRET
npm run db:deploy
npm run db:seed
npm run dev
```

Sign in at http://localhost:3000/login as `demo@marginchef.test`. Without a Resend key, the magic link is written to `.dev-outbox/`.
