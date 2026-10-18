# Flying Status Tracker — Rebuild Plan

## Context
A friend built "KGM Flying Status Tracker · 2027" in ChatGPT: one static `index.html` (~125KB, all logic inline), `airports.json` (OurAirports IATA → lat/lon), and airline/card images. Everything is saved in browser localStorage, and the only way to move data is a JSON export/import. The friend's own cards, trips, and 2027 targets are written into the code (`initializeXxx()` seed functions).

Goal: rebuild it as a public website. Anyone can sign up. There will be a free tier and a paid tier, but for now we build only the free tier, wire in payments, and decide later what goes behind the paywall. Target folder: `/Users/taylorakin/akin-digital/statustrack` (empty).

**Decided:** v1 is **Delta SkyMiles Medallion only** (MQDs). Programs, tiers, cards, and earning rules are still stored as **data, not code**, so Alaska (already in the original) and other airlines can be added later without a rewrite.

**v1 scope vs the original:**
- **Keep (Delta parts):** summary card with tier ladder (Silver 5k / Gold 10k / Platinum 15k / Diamond 28k, user picks a goal) · flights (fare → MQD, Potential/Booked/Credited) · flight map (routes still use `airports.json`) · MQD Headstarts per Delta Amex card type · 12-month spend grid (Reserve/Reserve Business 1 per $10, Platinum/Platinum Business 1 per $20) · Delta Stays/rental bonuses · chart · breakdown · earning-mix slider · ledger · export/import.
- **Drop for v1 (Alaska-only):** distance/segment calculators, 95K rollover selections, Summit/Ascent cards, the Alaska vs Delta tab switching. The engine keeps a `program` field so these can come back later.
- **Import:** the friend's backup imports its Delta entries. Alaska entries are kept but hidden until Alaska is supported.

## What the existing app does (feature inventory to match)
- **Entry model (core):** `{program, category: Flights|Credit card spend|Qualifying bonuses, state: Posted|Pending|Planned|Potential|Cancelled, date, description, method, amount, rate, override, notes, route?, roundtrip?, cardKey?}`. Credit = `override ?? amount × rate`. Cancelled entries are left out of every total.
- **Settings:** a target per program, plus an "as-of" date used for the monthly pace.
- **Sections:** airline summary cards (progress bar with tier markers, gap, monthly pace, tier ladder) · planned-flight cards (Booked/Credited toggles, filters) · SVG flight map (great-circle arcs, dashed = forecast, solid = credited) · headstarts/anniversary bonuses/rollover selections · 12-month card-spend grid per card · Delta Stays/rental bonuses · cumulative chart (posted vs forecast vs even pace) · "where earnings come from" breakdown · earning-mix scenario slider · activity ledger (filters, edit, delete) · JSON export/import.
- **Calculators:** route miles via haversine over `airports.json` (AS: 1 point/mile, ×5 per $, or 500 per segment); DL: 1 MQD per eligible fare $; card rates (Summit 1/$2, Ascent 1/$3, Reserve 1/$10, Platinum 1/$20); Headstarts of 2,500 MQD per card type.

## Decisions so far
- Audience: public signup. Free tier now, paid tier later (Stripe scaffolding only).
- v1 program: Delta only, with a data-driven model.
- Backend: **Neon Postgres + Drizzle + Better Auth** (Supabase and Clerk considered and rejected).

## Recommended stack
| Concern | Choice | Why |
|---|---|---|
| Framework | **Next.js (App Router) + TypeScript** | You already run Next.js projects (`my-site`, `marshall-pediatric-therapy`). One repo for UI and API. |
| UI | **Tailwind + shadcn/ui** | Fast, accessible primitives (dialogs, switches, selects) that cover the original's widgets. |
| Charts/map | **Custom SVG React components** ported from the original | The original draws its chart and map in hand-written SVG. Porting that keeps the look without adding a heavy library. |
| Database | **Postgres on Neon** + **Drizzle ORM** | Serverless Postgres with branching (a DB per preview deploy) and point-in-time restore. Drizzle is typed and its migrations are lightweight. |
| Auth | **Better Auth** (email+password, magic link, Google/Apple OAuth) | Open source, stores users in *your* Postgres, no per-user fees, and ships a Stripe plugin for later. (Alternative: Clerk. Faster to set up, but vendor-hosted and priced per user at scale.) |
| Email | **Resend** (+ React Email) | Verification, password reset, magic links, and later "your Headstart posted?" reminders. |
| Payments | **Stripe** (Checkout + Customer Portal + webhooks), via the Better Auth Stripe plugin | Free plan is the default. `subscription` table plus an `entitlements()` helper, so paywall gates can be added later with no schema change. |
| Validation | **Zod** | Shared client/server schemas (replaces the original's `validData()`). |
| Hosting | **Vercel Pro** | ⚠️ Vercel Hobby is non-commercial only, so a paid product needs Pro. (Cheaper alternative: Cloudflare Workers via OpenNext.) |
| Monitoring | **Sentry** (errors) + **PostHog** (product analytics, feature flags for paywall experiments) | |
| Bot protection | **Cloudflare Turnstile** on signup + rate limiting (Upstash) | Public signup attracts spam accounts. |
| Testing | **Vitest** (calculation engine) + **Playwright** (end-to-end) | |

## Things that are easy to overlook
1. **Airline IP / trademarks.** The original uses Delta (and Alaska) logos, aircraft photos, wordmarks, and Amex/Visa card art. A public, paid site can't ship those without a license. Plan: our own neutral visual identity with program colors only, card names in plain text, and a "Not affiliated with Alaska Airlines, Delta, or card issuers" disclaimer. Natural Earth map and OurAirports data are public domain, so those stay.
2. **Rules change every year.** Thresholds, card rates, and Headstarts shift annually (the footer already notes uncertainty about Delta's 2027 numbers). Needs an **admin screen** for programs, tiers, cards, and methods, with each rule set versioned by status year.
3. **Status year is hard-coded to 2027.** Users need a tracker per status year, plus year rollover.
4. **Personal seed data has to go.** Replace the friend's hard-coded trips and cards with an **onboarding flow**: pick programs → pick the cards you hold → set goals → optionally pre-fill monthly spend.
5. **Migration for the friend.** Importer for the original's JSON backup (`version: 1` format), so their existing data comes across.
6. **Legal:** Terms, Privacy Policy, "estimates only, not financial advice" disclaimer, account deletion plus data export (GDPR/CCPA), and a cookie notice if analytics run.
7. **Ops:** domain/DNS, Neon backups, separate staging and production environments, secrets management, and a support email.
8. **Entitlements design now, paywall later.** A single `getPlan(user)` and `can(user, feature)` layer, so later gating (e.g. multiple years, more airlines, reminders, CSV import) is configuration, not refactoring.

## Architecture
- `lib/engine/`: **pure TS calculation engine**, ported 1:1 from `index.html` with no React or DB dependencies: `credit()`, `totals()`, `tierProgress()`, `chartSeries()`, `earningMixModel()`, `routeMiles()`/`flightRouteCodes()`, `monthsLeft()`. Unit-tested against fixtures. Server and client both use it.
- `lib/db/schema.ts` (Drizzle):
  - Auth tables (Better Auth: `user`, `session`, `account`, `verification`)
  - Reference data: `program` (code, unit label), `tier` (program, year, name, threshold), `card` (program, name, rate divisor, headstart amount), `earning_method` (program, category, rate, hint)
  - User data: `tracker` (user, status year, targets, as_of), `tracker_card` (tracker, card, included), `entry` (tracker + the original entry fields), `subscription` (Stripe ids, plan, status)
- `app/(marketing)`: landing page, pricing, legal pages
- `app/(app)/dashboard`: the tracker. Each section is its own component (`SummaryCards`, `FlightList`, `FlightMap`, `BonusCards`, `MonthlySpendGrid`, `TravelBonuses`, `ProgressChart`, `Breakdown`, `EarningMix`, `Ledger`, `EntryDialog`, `SettingsDialog`)
- `app/(app)/onboarding`, `app/(app)/account` (profile, export, delete, billing portal)
- `app/admin`: manage rules and reference data (role-gated)
- Mutations go through Server Actions with Zod validation and optimistic UI. `airports.json` is served as a static asset, with lazy loading kept as in the original.

## Phased roadmap
0. **Setup:** repo, Next.js, Tailwind/shadcn, Neon (dev + prod branches), Drizzle, Vercel project, Sentry.
1. **Engine:** port the calculations into `lib/engine` with Vitest parity tests built from the friend's seed data.
2. **Auth + data:** Better Auth (email, magic link, Google), schema, seed Delta reference data for 2027 (tiers, 4 Amex cards, Headstarts, methods), CRUD Server Actions.
3. **Dashboard parity:** build every section from the inventory against real data, plus entry and settings dialogs.
4. **Onboarding + import:** program/card selection, goals, and the original-JSON importer.
5. **Billing scaffolding:** Stripe products (Free, Pro placeholder), Checkout, Portal, webhook → `subscription`, `can()` helper (everything allowed on Free for now).
6. **Launch hygiene:** landing page, legal pages, Turnstile, rate limits, account delete/export, admin rules screen, analytics, custom domain.

## Verification
- **Engine parity:** load the friend's exported backup into the original `index.html` and into the new engine. Delta totals, tiers, chart series, and earning-mix output must match exactly (Vitest snapshot).
- **E2E (Playwright):** sign up → onboard (pick cards) → add a flight by route → toggle Booked/Credited → confirm summary, chart, and map update → export → delete account.
- **Manual:** run the dev server in the browser pane and compare against the original served via `python3 -m http.server`, side by side at desktop and mobile widths.
- **Billing:** Stripe test mode with test cards on localhost; replay webhooks with the Stripe CLI.
