# Front Page Redesign Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the one-screen landing page with the approved Stratus Status front page (sky hero, product preview, features, how it works, closing CTA, footer), and rename the product from StatusTrack to Stratus Status.

**Architecture:** The page moves into a `src/app/(marketing)` route group (URL stays `/`). Each section is its own Server Component under `(marketing)/_components/`, and `page.tsx` only orders them. The product preview's numbers come from a small sample `Entry[]` run through the existing calculation engine, so they can't drift from the dashboard's math. A Vitest test pins them to the spec's values.

**Tech Stack:** Next.js 16.4 (App Router, Cache Components), React 19, Tailwind CSS 4.3, `next/image` with static imports, Vitest 5.

**Spec:** `docs/superpowers/specs/2026-10-20-front-page-design.md`. **Mockup:** `docs/design/front-page-mockup/index.html`. Where the two differ, the spec wins.

**Before you start:**
- Read `AGENTS.md`. This Next.js version has breaking changes. When an API is in doubt, check `node_modules/next/dist/docs/` (the image docs are at `01-app/03-api-reference/02-components/image.md`).
- Work on the branch `front-page-redesign`, which already has the spec and mockup committed.
- Formatting: Prettier with `printWidth: 150` and `singleQuote: true`. Run `pnpm format` before each commit.
- **Restart `pnpm dev` after Task 2.** A dev server that was already running kept serving the old `globals.css`, so `bg-sky-deep`, `bg-navy` and the other new color classes silently rendered as transparent. If a dev server is running and isn't yours, ask before restarting it, or check the page with `pnpm next build && pnpm next start -p 3100` instead.
- **Screenshots in the browser pane** sometimes capture the artwork before it paints. If an image area looks empty, scroll a little and take the screenshot again before you treat it as a bug.
- **Deliberate deviations from the spec:**
  - **"Potential" instead of "Planned":** the April flight's chip and the Flights feature card ("Potential, Booked, and Credited states") use "Potential". The dashboard calls an unbooked flight "Potential" (`flights-section.tsx`), so the front page uses the same words. Include both in Karl's copy review.
  - **Hero gradient height:** the deep-to-sky gradient above the artwork is `h-12 sm:h-16` (48px, then 64px), not the spec's "about 120px". Together with the artwork's 12% top fade, this gives the seamless join. 120px left too much empty sky in the dry run.
- **The front page exports no `metadata`.** It uses the root layout's default title, "Stratus Status", as the spec's Rename section says. Don't add a `metadata` export to `(marketing)/page.tsx`.

---

## File map

| File | Action | Responsibility |
|---|---|---|
| `vitest.config.mts` | Create | Lets tests resolve the `@/` path alias |
| `src/app/(marketing)/_components/sample-data.ts` | Create | Sample entries and tiers, plus the derived summary the preview shows |
| `src/app/(marketing)/_components/sample-data.test.ts` | Create | Pins the sample numbers to the spec |
| `src/app/globals.css` | Modify | Sky color tokens and reduced-motion-aware smooth scrolling |
| `src/app/layout.tsx` | Modify | Title template, description, `data-scroll-behavior` |
| `src/app/dashboard/page.tsx`, `src/app/(auth)/sign-in/page.tsx`, `src/app/(auth)/sign-up/page.tsx` | Modify | Drop the hard-coded "· StatusTrack" from titles |
| `README.md` | Modify | New title and first line |
| `src/app/(marketing)/_assets/{logo,sky-hero,cloud-band}.webp` | Create | Artwork, copied from `docs/design/front-page-mockup/` |
| `src/app/(marketing)/_components/logo.tsx` | Create | Icon and wordmark |
| `src/app/(marketing)/_components/site-header.tsx` | Create | Top navigation |
| `src/app/(marketing)/_components/hero.tsx` | Create | Header, headline, CTAs, sky artwork |
| `src/app/(marketing)/_components/product-preview.tsx` | Create | Sample summary card, flights card, mini chart |
| `src/app/(marketing)/_components/features.tsx` | Create | Four feature cards |
| `src/app/(marketing)/_components/how-it-works.tsx` | Create | Three steps |
| `src/app/(marketing)/_components/closing-cta.tsx` | Create | Final CTA over the cloud band |
| `src/app/(marketing)/_components/site-footer.tsx` | Create | Logo and disclaimer |
| `src/app/(marketing)/page.tsx` | Create | Orders the sections |
| `src/app/page.tsx` | Delete | Replaced by the route group's page |

---

## Chunk 1: Foundations

### Task 1: Sample data, derived from the engine (TDD)

**Files:**
- Create: `vitest.config.mts`
- Create: `src/app/(marketing)/_components/sample-data.ts`
- Test: `src/app/(marketing)/_components/sample-data.test.ts`

Background: Vitest currently runs with no config, so `@/` imports fail in tests ("Failed to resolve import"). Vite 8 resolves tsconfig paths natively with `resolve.tsconfigPaths`.

- [ ] **Step 1: Add the Vitest config**

```ts
// vitest.config.mts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { tsconfigPaths: true },
});
```

Run: `pnpm test`
Expected: PASS. The existing engine suite still passes (21 tests).

- [ ] **Step 2: Write the failing test**

```ts
// src/app/(marketing)/_components/sample-data.test.ts
import { describe, expect, it } from 'vitest';
import { progressScale } from '@/lib/engine';
import { SAMPLE, sampleFlights } from './sample-data';

describe('front page sample data', () => {
  it('matches the spec: 2027, as of March 1, Gold goal', () => {
    const s = SAMPLE.summary;
    expect(s.totals).toEqual({ posted: 7840, pending: 720, planned: 2950, forecast: 11510 });
    expect(s.actualGap).toBe(2160);
    expect(s.forecastGap).toBe(0);
    expect(s.monthsLeft).toBe(10);
    expect(s.monthlyPace).toBe(216);
    expect(Math.round(s.postedPercent)).toBe(78);
  });

  it('draws the bar on the 0–28,000 tier scale', () => {
    expect(progressScale(SAMPLE.tiers, SAMPLE.target)).toBe(28000);
  });

  it('lists three flights oldest first with dashboard chip labels', () => {
    expect(sampleFlights().map((f) => [f.name, f.date, f.status])).toEqual([
      ['ATL → JFK', 'Jan 28', 'Credited'],
      ['ATL → LAX', 'Mar 14', 'Booked'],
      ['LAX → SEA → ATL', 'Apr 2', 'Potential'],
    ]);
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `pnpm vitest run "src/app/(marketing)"`
Expected: FAIL, because `./sample-data` can't be resolved.

- [ ] **Step 4: Write the implementation**

The entries add up as follows. Posted: two Headstarts (5,000), the JFK flight (640) and Reserve spend in Jan and Feb (2,200), for 7,840. Pending: February Platinum spend, $14,400 ÷ 20 = 720. Planned or Potential: the LAX flight (1,150), the SEA flight (800) and projected Reserve spend (1,000), for 2,950.

```ts
// src/app/(marketing)/_components/sample-data.ts
import { flightName, goalSummary, type Category, type Entry, type EntryState, type Tier } from '@/lib/engine';
import { MONTH_SHORT } from '@/lib/format';

/** The moment the front page preview shows. Not anyone's real data. */
const YEAR = 2027;
const AS_OF = '2027-03-01';
const TARGET = 10000;
const TIERS: Tier[] = [
  { name: 'Silver', threshold: 5000 },
  { name: 'Gold', threshold: 10000 },
  { name: 'Platinum', threshold: 15000 },
  { name: 'Diamond', threshold: 28000 },
];

const entry = (id: string, category: Category, state: EntryState, date: string, description: string, amount: number, rate = 1, route?: string): Entry => ({
  id,
  program: 'DL',
  category,
  state,
  date,
  description,
  method: '',
  amount,
  rate,
  override: null,
  notes: '',
  route,
});

const ENTRIES: Entry[] = [
  entry('hs-reserve', 'Qualifying bonuses', 'Posted', '2027-01-01', 'Reserve MQD Headstart', 2500),
  entry('hs-platinum', 'Qualifying bonuses', 'Posted', '2027-01-01', 'Platinum MQD Headstart', 2500),
  entry('jfk', 'Flights', 'Posted', '2027-01-28', 'New York', 640, 1, 'ATL-JFK'),
  entry('reserve-jan', 'Credit card spend', 'Posted', '2027-01-31', 'Reserve · January', 12000, 0.1),
  entry('reserve-feb', 'Credit card spend', 'Posted', '2027-02-28', 'Reserve · February', 10000, 0.1),
  entry('platinum-feb', 'Credit card spend', 'Pending', '2027-02-28', 'Platinum · February', 14400, 0.05),
  entry('lax', 'Flights', 'Planned', '2027-03-14', 'Los Angeles', 1150, 1, 'ATL-LAX'),
  entry('sea', 'Flights', 'Potential', '2027-04-02', 'Seattle', 800, 1, 'LAX-SEA-ATL'),
  entry('reserve-rest', 'Credit card spend', 'Planned', '2027-12-31', 'Reserve · rest of year', 10000, 0.1),
];

export const SAMPLE = {
  year: YEAR,
  target: TARGET,
  tiers: TIERS,
  goalName: 'Gold',
  summary: goalSummary(ENTRIES, 'DL', TARGET, AS_OF, YEAR),
};

/** Same words as the dashboard's flight toggles: Credited = posted, Booked = projected, Potential = not booked yet. */
function flightStatus(state: EntryState) {
  if (state === 'Posted') return 'Credited';
  if (state === 'Potential') return 'Potential';
  return 'Booked';
}

export function sampleFlights() {
  return ENTRIES.filter((e) => e.category === 'Flights')
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((e) => {
      const [, month, day] = e.date.split('-').map(Number);
      return { id: e.id, name: flightName(e), date: `${MONTH_SHORT[month - 1]} ${day}`, status: flightStatus(e.state) };
    });
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `pnpm vitest run "src/app/(marketing)"`
Expected: PASS (3 tests). If `monthlyPace` is off by floating-point error, the entries are wrong, not the test: recheck the amounts above.

- [ ] **Step 6: Commit**

```bash
pnpm format
git add vitest.config.mts "src/app/(marketing)/_components/sample-data.ts" "src/app/(marketing)/_components/sample-data.test.ts"
git commit -m "Add front page sample data derived from the engine"
```

### Task 2: Tokens, smooth scrolling and the rename

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`
- Modify: `src/app/dashboard/page.tsx:7`, `src/app/(auth)/sign-in/page.tsx:3`, `src/app/(auth)/sign-up/page.tsx:3`
- Modify: `README.md:1-3`

- [ ] **Step 1: Add the tokens and scroll rule to `globals.css`**

In `:root`, after `--accent`:

```css
  /* Front page sky, matched to the Stratus Status artwork. Text on blue always sits on --sky-deep (white 5.0:1). */
  --sky: #2f9ff9;
  --sky-deep: #1570c8;
  --sky-ink: #1667b8;
  --navy: #1b2547;
```

In `@theme inline`, after `--color-accent`:

```css
  --color-sky: var(--sky);
  --color-sky-deep: var(--sky-deep);
  --color-sky-ink: var(--sky-ink);
  --color-navy: var(--navy);
```

After the `body { … }` rule:

```css
/* In-page anchor links scroll smoothly; route changes stay instant via data-scroll-behavior on <html>. */
@media (prefers-reduced-motion: no-preference) {
  html {
    scroll-behavior: smooth;
  }
}
```

- [ ] **Step 2: Update the root layout**

In `src/app/layout.tsx`, replace the `metadata` export and add the attribute to `<html>`:

```tsx
export const metadata: Metadata = {
  title: { default: 'Stratus Status', template: '%s · Stratus Status' },
  description: 'Track your Delta Medallion status: posted and projected MQDs from flights, card spend, and Headstarts.',
};
```

```tsx
<html lang="en" data-scroll-behavior="smooth" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
```

- [ ] **Step 3: Drop the suffix from page titles**

- `src/app/dashboard/page.tsx`: `export const metadata = { title: 'Dashboard' };`
- `src/app/(auth)/sign-in/page.tsx`: `export const metadata = { title: 'Sign in' };`
- `src/app/(auth)/sign-up/page.tsx`: `export const metadata = { title: 'Create account' };`

- [ ] **Step 4: Update the README's first lines**

```markdown
# Stratus Status

Taylor and Karl's airline status tracker (stratusstatus.com): plan and track Delta SkyMiles Medallion Qualifying Dollars (MQDs) from flights, card spend, Headstarts, and bonuses.
```

- [ ] **Step 5: Check nothing else uses the old name**

Run: `grep -rn "StatusTrack" src README.md`
Expected: only `src/app/page.tsx` (the old landing eyebrow, deleted in Task 3).

Run: `pnpm typecheck && pnpm lint`
Expected: both pass.

- [ ] **Step 6: Commit**

```bash
pnpm format
git add src/app/globals.css src/app/layout.tsx src/app/dashboard/page.tsx "src/app/(auth)" README.md
git commit -m "Rename to Stratus Status and add the sky color tokens"
```

---

## Chunk 2: The page

All components below are Server Components (no `'use client'`). Shared layout classes: the content width is `mx-auto w-full max-w-[1120px] px-4 sm:px-6`.

### Task 3: Assets, logo, header, hero, and the route move

**Files:**
- Create: `src/app/(marketing)/_assets/logo.webp`, `sky-hero.webp`, `cloud-band.webp`
- Create: `src/app/(marketing)/_components/logo.tsx`, `site-header.tsx`, `hero.tsx`
- Create: `src/app/(marketing)/page.tsx`
- Delete: `src/app/page.tsx`

- [ ] **Step 1: Copy the artwork**

```bash
mkdir -p "src/app/(marketing)/_assets"
cp docs/design/front-page-mockup/{logo,sky-hero,cloud-band}.webp "src/app/(marketing)/_assets/"
```

- [ ] **Step 2: Logo**

```tsx
// src/app/(marketing)/_components/logo.tsx
import Image from 'next/image';
import Link from 'next/link';
import logo from '../_assets/logo.webp';

/** Icon + wordmark. `light` sits on the sky; `dark` on the page background. */
export function Logo({ tone }: { tone: 'light' | 'dark' }) {
  return (
    <Link href="/" className={`flex items-center gap-2.5 whitespace-nowrap text-base font-semibold tracking-tight sm:text-lg ${tone === 'light' ? 'text-white' : 'text-foreground'}`}>
      <Image src={logo} alt="" width={34} height={34} className="rounded-[9px] shadow-[0_2px_8px_rgba(0,40,90,.25)]" />
      Stratus Status
    </Link>
  );
}
```

- [ ] **Step 3: Site header**

```tsx
// src/app/(marketing)/_components/site-header.tsx
import Link from 'next/link';
import { Logo } from './logo';

export function SiteHeader() {
  return (
    <nav className="flex items-center justify-between gap-4 py-5" aria-label="Main">
      <Logo tone="light" />
      <div className="flex items-center gap-4 whitespace-nowrap text-[15px] font-medium text-white sm:gap-5">
        <a href="#features" className="hidden sm:inline">
          Features
        </a>
        <a href="#how" className="hidden sm:inline">
          How it works
        </a>
        <Link href="/sign-in">Sign in</Link>
        <Link href="/sign-up" className="rounded-full bg-white px-3.5 py-2 font-semibold text-navy sm:px-4">
          Get started
        </Link>
      </div>
    </nav>
  );
}
```

- [ ] **Step 4: Hero**

The background is solid `--sky-deep` behind all text, then a gradient to `--sky`, then the artwork. Its top edge fades out with a mask so there's no seam. `mask-t-from-88%` means the bottom 88% is opaque and the top 12% fades out. Any lower and the fade eats into the top of the gauge.

```tsx
// src/app/(marketing)/_components/hero.tsx
import Image from 'next/image';
import Link from 'next/link';
import skyHero from '../_assets/sky-hero.webp';
import { SiteHeader } from './site-header';

export function Hero() {
  return (
    <header className="bg-sky-deep text-white">
      <div className="mx-auto w-full max-w-[1120px] px-4 sm:px-6">
        <SiteHeader />
        <div className="pt-10 text-center sm:pt-14">
          <span className="inline-block rounded-full border border-white/40 px-3 py-1.5 text-xs font-bold uppercase tracking-[2px]">
            For Delta SkyMiles Medallion members
          </span>
          <h1 className="mx-auto mt-5 max-w-[820px] text-[clamp(38px,6vw,66px)] font-semibold leading-[1.02] tracking-[-2px]">
            Know exactly where your status stands.
          </h1>
          <p className="mx-auto mt-[18px] max-w-[620px] text-[19px] leading-normal">
            Track posted and projected MQDs from flights, card spend, and Headstarts, and see what it takes to reach your next Medallion tier.
          </p>
          <div className="mt-[30px] flex flex-wrap justify-center gap-3">
            <Link href="/sign-up" className="rounded-xl bg-navy px-[22px] py-3.5 font-semibold shadow-[0_6px_20px_rgba(10,30,70,.3)]">
              Get started for free
            </Link>
            <Link href="/sign-in" className="rounded-xl bg-white px-[22px] py-3.5 font-semibold text-navy">
              Sign in
            </Link>
          </div>
        </div>
      </div>
      <div className="h-12 bg-linear-to-b from-sky-deep to-sky sm:h-16" />
      <div className="bg-sky">
        <Image
          src={skyHero}
          alt=""
          sizes="100vw"
          loading="eager"
          fetchPriority="high"
          placeholder="blur"
          className="block h-auto max-h-[520px] min-h-[220px] w-full object-cover object-[center_30%] mask-t-from-88%"
        />
      </div>
      <div className="h-10 bg-linear-to-b from-white to-background sm:h-[120px]" />
    </header>
  );
}
```

- [ ] **Step 5: Page with the hero only, and delete the old page**

```tsx
// src/app/(marketing)/page.tsx
import { Hero } from './_components/hero';

export default function Home() {
  return (
    <main className="flex-1">
      <Hero />
    </main>
  );
}
```

```bash
git rm src/app/page.tsx
```

- [ ] **Step 6: Look at it**

Run `pnpm dev` (or use the running dev server) and open `http://localhost:3000/`. At this point the page is the hero only, a short page that ends after the clouds; the preview comes in Task 4.
Check:
- The page is deep blue behind the text and lightens to the artwork with no visible seam or hard edge.
- The plane and gauge sit centered under the buttons.
- At 375px wide, the header stays on one line, showing the logo, "Sign in" and "Get started".

If a seam shows, adjust the `mask-t-from-*` percentage (lower fades more, but below about 85% it fades the top of the gauge), not the colors.

- [ ] **Step 7: Commit**

```bash
pnpm format
git add "src/app/(marketing)"   # the deletion of src/app/page.tsx is already staged by git rm
git commit -m "Add the Stratus Status hero in a marketing route group"
```

### Task 4: Product preview

**Files:**
- Create: `src/app/(marketing)/_components/product-preview.tsx`
- Modify: `src/app/(marketing)/page.tsx`

The preview copies the dashboard summary card's classes (`src/app/dashboard/_components/summary-card.tsx`). It doesn't import that card, which is a client component bound to `useTracker`.

- [ ] **Step 1: Write the component**

```tsx
// src/app/(marketing)/_components/product-preview.tsx
import { progressScale } from '@/lib/engine';
import { fmt, percent } from '@/lib/format';
import { SAMPLE, sampleFlights } from './sample-data';

const CHIP: Record<string, string> = {
  Credited: 'bg-[#e4f3ea] text-[#0a6e56]',
  Booked: 'bg-[#e7f0fa] text-brand',
  Potential: 'border border-dashed border-[#b9c2c6] bg-[#f6f7f6] text-muted',
};

// Mini chart: x is Jan 1 → Dec 31 across 300px, y is 0 → 12,000 MQDs (110px → 10px).
const y = (mqd: number) => +(110 - mqd / 120).toFixed(1);
const POSTED_PATH: [number, number][] = [
  [0, 0],
  [5, 5000], // Headstarts
  [25, 5760],
  [50, SAMPLE.summary.totals.posted], // March 1
];

export function ProductPreview() {
  const s = SAMPLE.summary;
  const t = s.totals;
  const scale = progressScale(SAMPLE.tiers, SAMPLE.target);
  const pct = (v: number) => `${Math.min(100, (v / scale) * 100)}%`;
  const [lastX, lastMqd] = POSTED_PATH[POSTED_PATH.length - 1];

  return (
    <figure className="relative z-10 mx-auto -mt-16 w-full max-w-[1120px] px-4 sm:px-6 min-[640px]:-mt-[120px] min-[900px]:-mt-[230px]">
      <div className="grid gap-5 min-[900px]:grid-cols-[1.15fr_.85fr]">
        <article className="overflow-hidden rounded-[18px] border border-line bg-surface shadow-[0_24px_60px_rgba(16,40,80,.16)]">
          <div className="border-t-[5px] border-accent bg-[linear-gradient(120deg,#002750,#003366_55%,#1b4f86)] px-[22px] py-[18px] text-white">
            <p className="text-[11px] font-bold uppercase tracking-[2px] text-white/70">Delta SkyMiles · {SAMPLE.year}</p>
            <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-[22px] font-semibold">Medallion Status</h3>
              <span className="rounded-full border border-white/50 bg-white/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider">
                {SAMPLE.goalName} Medallion goal
              </span>
            </div>
          </div>
          <div className="px-[22px] pb-[22px] pt-[18px]">
            <p className="text-[42px] font-semibold tracking-[-2px] text-brand">
              {fmt(t.posted)} <small className="text-[15px] font-normal tracking-normal text-muted">/ {fmt(SAMPLE.target)}</small>
            </p>
            <p className="text-xs text-muted">Posted MQDs · {percent(s.postedPercent)} of goal</p>

            <div className="relative mb-2 mt-[26px] h-3 rounded-full bg-[#e8ecee]">
              <div className="absolute inset-y-0 left-0 rounded-full bg-[repeating-linear-gradient(45deg,#9fb7cf_0_6px,#b8cadb_6px_12px)]" style={{ width: pct(t.forecast) }} />
              <div className="absolute inset-y-0 left-0 rounded-full bg-brand" style={{ width: pct(t.posted) }} />
              {SAMPLE.tiers.map((tier, i) => {
                const last = i === SAMPLE.tiers.length - 1;
                return (
                  <span
                    key={tier.name}
                    className={`absolute -top-[18px] text-[10px] text-muted ${last ? '-translate-x-full' : '-translate-x-1/2'}`}
                    style={{ left: pct(tier.threshold) }}
                  >
                    {tier.name === 'Platinum' ? 'Plat' : tier.name}
                  </span>
                );
              })}
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2.5">
              {(
                [
                  ['Projected', t.planned],
                  ['Pending', t.pending],
                  ['Posted', t.posted],
                ] as const
              ).map(([label, value]) => (
                <div key={label}>
                  <small className="text-xs text-muted">{label}</small>
                  <strong className="block text-[22px] text-brand">{fmt(value)}</strong>
                </div>
              ))}
            </div>

            <p className="mt-4 rounded-lg border-l-[3px] border-accent bg-[#f9eef1] px-3 py-2.5 text-[13px] text-muted">
              <b className="text-accent">{fmt(s.actualGap)} MQDs</b> to {SAMPLE.goalName} from posted
              {s.forecastGap === 0 ? ' — already covered by your forecast.' : '.'} {fmt(s.monthlyPace ?? 0)} MQDs / month across {s.monthsLeft} remaining months.
            </p>
          </div>
        </article>

        <div className="grid gap-5">
          <article className="rounded-[18px] border border-line bg-surface px-5 py-[18px] shadow-[0_24px_60px_rgba(16,40,80,.16)]">
            <h4 className="mb-3 text-[13px] font-semibold">Your flights</h4>
            <ul>
              {sampleFlights().map((f) => (
                <li key={f.id} className="flex items-center justify-between border-t border-[#eef1f0] py-[9px] text-[13px] first:border-t-0">
                  <span>
                    {f.name} · {f.date}
                  </span>
                  <span className={`rounded-full px-2 py-[3px] text-[10px] font-bold uppercase tracking-[.6px] ${CHIP[f.status]}`}>{f.status}</span>
                </li>
              ))}
            </ul>
          </article>
          <article className="rounded-[18px] border border-line bg-surface px-5 py-[18px] shadow-[0_24px_60px_rgba(16,40,80,.16)]">
            <h4 className="mb-3 text-[13px] font-semibold">Posted vs forecast</h4>
            <svg viewBox="0 0 300 120" preserveAspectRatio="none" className="block h-[120px] w-full" aria-hidden="true">
              <line x1="0" y1={y(SAMPLE.target)} x2="300" y2={y(SAMPLE.target)} stroke="#e6c4cb" />
              <text x="296" y={y(SAMPLE.target) - 4} textAnchor="end" fontSize="9" fill="#b5122b">
                {SAMPLE.goalName}
              </text>
              <line x1="0" y1="110" x2="300" y2={y(SAMPLE.target)} stroke="#c9d3d8" strokeDasharray="4 4" />
              <path d={`M${lastX} ${y(lastMqd)} L300 ${y(s.totals.forecast)}`} fill="none" stroke="#9fb7cf" strokeWidth="2.5" strokeDasharray="6 5" />
              <path d={POSTED_PATH.map(([x, v], i) => `${i ? 'L' : 'M'}${x} ${y(v)}`).join(' ')} fill="none" stroke="#003366" strokeWidth="3" />
              <circle cx={lastX} cy={y(lastMqd)} r="4.5" fill="#003366" />
            </svg>
            <p className="mt-1.5 text-xs text-muted">Solid = posted · dashed = forecast · grey = even pace</p>
          </article>
        </div>
      </div>
      <figcaption className="mt-3 text-center text-xs text-muted">Example dashboard with sample data</figcaption>
    </figure>
  );
}
```

- [ ] **Step 2: Add it to the page under `<Hero />`**

```tsx
import { Hero } from './_components/hero';
import { ProductPreview } from './_components/product-preview';
// …
      <Hero />
      <ProductPreview />
```

- [ ] **Step 3: Look at it**

At 1440px wide, the preview overlaps the bottom of the clouds by about 230px, and the summary card reads 7,840 / 10,000, 78%, Projected 2,950, Pending 720, Posted 7,840. The tier labels sit above the bar at Silver ≈ 18%, Gold ≈ 36%, Plat ≈ 54%, and Diamond at the right edge.

The callout reads "2,160 MQDs to Gold from posted — already covered by your forecast. 216 MQDs / month across 10 remaining months."

At 768px and 375px wide, the cards stack, still overlap the clouds a little, and nothing scrolls sideways.

- [ ] **Step 4: Commit**

```bash
pnpm format
git add "src/app/(marketing)"
git commit -m "Add the front page product preview"
```

### Task 5: Features and How it works

**Files:**
- Create: `src/app/(marketing)/_components/features.tsx`, `how-it-works.tsx`
- Modify: `src/app/(marketing)/page.tsx`

- [ ] **Step 1: Features**

```tsx
// src/app/(marketing)/_components/features.tsx
import type { ReactNode } from 'react';

const icon = (d: ReactNode) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {d}
  </svg>
);

const FEATURES = [
  {
    title: 'Flights',
    body: 'Fare to MQDs, with Potential, Booked, and Credited states and a route map of your year.',
    icon: icon(
      <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />,
    ),
  },
  {
    title: 'Card spend',
    body: "A 12-month spend grid for Delta Amex cards, at each card's MQD rate.",
    icon: icon(
      <>
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <path d="M2 10h20" />
      </>,
    ),
  },
  {
    title: 'Headstarts & bonuses',
    body: 'Card Headstarts, Delta Stays, and rental bonuses counted the moment they post.',
    icon: icon(<path d="M4 22V4a1 1 0 0 1 1-1h11l-2 4 2 4H5" />),
  },
  {
    title: 'Forecast & pace',
    body: 'See your monthly pace, gap to goal, and test earning mixes before you book.',
    icon: icon(
      <>
        <path d="M3 3v18h18" />
        <path d="m7 15 4-4 3 3 5-6" />
      </>,
    ),
  },
];

export function Features() {
  return (
    <section id="features" className="mx-auto w-full max-w-[1120px] scroll-mt-6 px-4 pt-24 sm:px-6">
      <p className="text-xs font-bold uppercase tracking-[2px] text-sky-ink">Every MQD, in one place</p>
      <h2 className="mt-2.5 max-w-[640px] text-[clamp(28px,3.6vw,40px)] font-semibold leading-[1.1] tracking-[-1.2px]">
        All the ways you earn, added up for you.
      </h2>
      <p className="mt-3 max-w-[600px] text-[17px] leading-relaxed text-muted">
        Enter what you&apos;ve flown, booked, and spent. Stratus Status keeps posted, pending, and projected MQDs apart so you always know what&apos;s real and
        what&apos;s planned.
      </p>
      <div className="mt-9 grid gap-4 sm:grid-cols-2 min-[900px]:grid-cols-4">
        {FEATURES.map((f) => (
          <div key={f.title} className="rounded-2xl border border-line bg-surface p-[22px]">
            <div className="grid size-10 place-items-center rounded-[11px] bg-[linear-gradient(160deg,#3aaefb,#1f86e8)] text-white">{f.icon}</div>
            <h3 className="mb-1.5 mt-4 text-[17px] font-semibold">{f.title}</h3>
            <p className="text-sm leading-normal text-muted">{f.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
```

The flights description says "Potential, Booked, and Credited", using the dashboard's words. This matches the preview's chip deviation.

- [ ] **Step 2: How it works**

```tsx
// src/app/(marketing)/_components/how-it-works.tsx
const STEPS = [
  { title: 'Pick your goal tier', body: "Silver, Gold, Platinum, or Diamond for the status year you're chasing." },
  { title: 'Add flights and cards', body: "Tell us the Delta cards you hold and the trips you've taken or booked." },
  { title: 'Watch the gap close', body: "Your dashboard shows what's posted, what's coming, and what's still needed." },
];

export function HowItWorks() {
  return (
    <section id="how" className="mx-auto w-full max-w-[1120px] scroll-mt-6 px-4 pt-24 sm:px-6">
      <p className="text-xs font-bold uppercase tracking-[2px] text-sky-ink">Set up in minutes</p>
      <h2 className="mt-2.5 max-w-[640px] text-[clamp(28px,3.6vw,40px)] font-semibold leading-[1.1] tracking-[-1.2px]">Three steps to a clear answer.</h2>
      <ol className="relative mt-9 grid gap-7 sm:grid-cols-3 sm:gap-0 sm:before:absolute sm:before:left-[18px] sm:before:right-1/3 sm:before:top-[18px] sm:before:border-t-2 sm:before:border-dashed sm:before:border-[#b9c8d3]">
        {STEPS.map((step, i) => (
          <li key={step.title} className="sm:pr-6">
            <span className="relative z-10 grid size-9 place-items-center rounded-full bg-navy text-[15px] font-semibold text-white">{i + 1}</span>
            <h3 className="mb-1.5 mt-4 text-lg font-semibold">{step.title}</h3>
            <p className="max-w-[300px] text-[15px] leading-normal text-muted">{step.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
```

- [ ] **Step 3: Add both to the page after `<ProductPreview />`**

```tsx
import { Features } from './_components/features';
import { HowItWorks } from './_components/how-it-works';
// …
      <ProductPreview />
      <Features />
      <HowItWorks />
```

- [ ] **Step 4: Look at it**

- "Features" and "How it works" in the header scroll smoothly to their sections, and the headings aren't hidden under anything.
- Features show four columns at 1440px, two at 768px and one at 375px.
- The dashed step connector only shows at 640px and wider.

- [ ] **Step 5: Commit**

```bash
pnpm format
git add "src/app/(marketing)"
git commit -m "Add the features and how-it-works sections"
```

### Task 6: Closing CTA and footer

**Files:**
- Create: `src/app/(marketing)/_components/closing-cta.tsx`, `site-footer.tsx`
- Modify: `src/app/(marketing)/page.tsx`

- [ ] **Step 1: Closing CTA**

```tsx
// src/app/(marketing)/_components/closing-cta.tsx
import Image from 'next/image';
import Link from 'next/link';
import cloudBand from '../_assets/cloud-band.webp';

export function ClosingCta() {
  return (
    <section className="mt-28 bg-sky-deep text-center text-white">
      <div className="px-4 pt-[72px]">
        <h2 className="mx-auto max-w-[700px] text-[clamp(28px,3.6vw,40px)] font-semibold leading-[1.1] tracking-[-1.2px]">
          Plan your next Medallion year with confidence.
        </h2>
        <p className="mt-3 text-[17px]">Free to use. No airline login required.</p>
        <Link href="/sign-up" className="mt-[30px] inline-block rounded-xl bg-navy px-[22px] py-3.5 font-semibold shadow-[0_6px_20px_rgba(10,30,70,.3)]">
          Get started for free
        </Link>
      </div>
      <div className="mt-10 h-12 bg-linear-to-b from-sky-deep to-sky" />
      <div className="bg-sky">
        <Image src={cloudBand} alt="" sizes="100vw" placeholder="blur" className="block h-[220px] w-full object-cover object-bottom mask-t-from-90%" />
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Footer**

```tsx
// src/app/(marketing)/_components/site-footer.tsx
import { Logo } from './logo';

export function SiteFooter() {
  return (
    <footer className="bg-white pb-10 pt-7 text-[13px] text-muted">
      <div className="mx-auto w-full max-w-[1120px] px-4 sm:px-6">
        <Logo tone="dark" />
        <p className="mt-2.5 max-w-[520px]">
          Estimates only. Not affiliated with Delta Air Lines or American Express. Delta&apos;s posted MQDs are the source of truth.
        </p>
      </div>
    </footer>
  );
}
```

- [ ] **Step 3: Final page**

```tsx
// src/app/(marketing)/page.tsx
import { ClosingCta } from './_components/closing-cta';
import { Features } from './_components/features';
import { Hero } from './_components/hero';
import { HowItWorks } from './_components/how-it-works';
import { ProductPreview } from './_components/product-preview';
import { SiteFooter } from './_components/site-footer';

export default function Home() {
  return (
    <>
      <main className="flex-1">
        <Hero />
        <ProductPreview />
        <Features />
        <HowItWorks />
        <ClosingCta />
      </main>
      <SiteFooter />
    </>
  );
}
```

- [ ] **Step 4: Look at it**

- The closing section's text sits on deep blue, which lightens into the cloud band with no seam.
- The footer shows the dark logo and the disclaimer.

- [ ] **Step 5: Commit**

```bash
pnpm format
git add "src/app/(marketing)"
git commit -m "Add the closing CTA and footer"
```

---

## Chunk 3: Verification

### Task 7: Verify against the spec

Use @superpowers:verification-before-completion. Report actual output, not expectations.

- [ ] **Step 1: Automated checks**

Run: `pnpm test && pnpm typecheck && pnpm lint`
Expected: all pass (24 tests).

Run: `pnpm next build` (without `vercel-build`, which runs migrations)
Expected: the build succeeds, and the route table marks `/` as static (○ or ◐, not ƒ).

- [ ] **Step 2: Browser checks at 1440, 768 and 375px wide**

- The page matches the mockup, except where the spec differs: deeper blue behind text, a solid white "Sign in" button, an outline eyebrow chip, and the corrected sample data.
- No horizontal scroll at any width, including 320px. In the console, `document.documentElement.scrollWidth === innerWidth`.
- "Get started" and "Get started for free" go to `/sign-up`, and "Sign in" goes to `/sign-in`.
- The anchor links scroll smoothly. With reduced motion emulated, they jump.
- Signing in, then landing on `/dashboard`, doesn't smooth-scroll.
- Tab titles: "Stratus Status", "Sign in · Stratus Status", "Create account · Stratus Status", "Dashboard · Stratus Status".
- In the network panel, the hero image request has high priority, and the page doesn't shift as images load.

- [ ] **Step 3: Contrast spot-check**

With the browser's accessibility inspector, check:
- the white text in the hero and closing section on `#1570c8` (≥ 4.5:1);
- the kickers in `#1667b8` on `#f4f5f3` (≥ 4.5:1);
- the eyebrow chip, which has no fill.

- [ ] **Step 4: Commit any fixes, then hand off**

If fixes were needed, commit them with a message naming what was fixed. Then tell Taylor the branch is ready. Karl needs to review the new copy (eyebrow, feature text, steps, closing line) before it merges.
