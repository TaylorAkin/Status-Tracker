# Dashboard Help Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add "?" tips and three guided tours to the dashboard, with tour progress saved per user.

**Architecture:**
- **Help folder:** all help UI lives in `src/app/dashboard/_components/help/`. Tips and the help menu use the browser's Popover API. The tour is its own modal `<dialog>`, which it re-shows above the Add earning dialog when a step points inside it.
- **Copy and positioning:** all copy is in one `help-content.ts`. Positioning and the "what to show on load" decision are pure functions with Vitest tests.
- **Saving progress:** progress is stored in a new `user_tour` table. It's loaded with the dashboard data and saved through one server action.

**Tech Stack:** Next.js 16.4 (App Router, Server Actions, `refresh()` from `next/cache`), React 19.3 (`useOptimistic`, `useEffectEvent`), Drizzle ORM on Neon Postgres, Tailwind CSS 4, Vitest 5.

**Spec:** `docs/superpowers/specs/2026-10-20-dashboard-help-design.md`. Where this plan and the spec differ, the plan's "Deliberate deviations" below explain why.

**Before you start:**
- **Next.js:** read `AGENTS.md`. This Next.js version has breaking changes. This plan only uses APIs the dashboard already uses (Server Actions, `refresh()`), but check `node_modules/next/dist/docs/` if anything is in doubt.
- **Branch:** work on `dashboard-help`. It already has the spec committed.
- **Formatting:** Prettier with `printWidth: 150` and `singleQuote: true`. Run `pnpm format` before each commit. `src/lib/auth.ts` is already committed in a form Prettier rewrites, so `pnpm format` leaves it modified: revert it with `git checkout src/lib/auth.ts` and don't commit it.
- **Checks:**
  - `pnpm test` runs Vitest in a Node environment, with no DOM, so only the pure modules have unit tests.
  - `pnpm typecheck` and `pnpm lint` must pass before each commit.
  - Lint uses `eslint-plugin-react-hooks` 7, which flags `setState` called synchronously in an effect body and refs read during render. The code below avoids both. Keep it that way: schedule work in `requestAnimationFrame`, mutate DOM styles through refs, and use `useEffectEvent` for effect logic that reads fresh props.
- **Database:**
  - `pnpm db:migrate` applies migrations to the `DATABASE_URL` in `.env.local`. Before running it, confirm that URL points at the Neon **development** branch. If you can't tell, stop and ask Taylor.
  - Production gets the migration automatically on deploy (`vercel-build` runs `drizzle-kit migrate`).
- **Merging:** open a pull request into `main` and never merge locally.
- **Deliberate deviations from the spec:**
  - **Entry dialog preset:** the tour opens the entry dialog with the same preset as the flights panel's "+ Add flight" button, `{ category: 'Flights', method: 'fare', title: 'Add flight' }`, instead of `{ category: 'Flights' }`. The fare method is what step 8 talks about, and the dialog's title then matches the tour.
  - **`useAnchoredPopover` hook:** one small hook is added, `use-anchored-popover.ts`. It holds the popover positioning that `InfoTip` and `HelpMenu` share.
  - **No auto-start effect:** the first-visit tour starts from `TourProvider`'s lazy initial state, not from a mount effect. That makes the spec's StrictMode guard unnecessary, and the server-rendered HTML matches the client.
  - **`markTour` lives in the tracker context:** the context gets a `markTour(key, status)` helper that wraps `run`, so the tour and the banner don't repeat the optimistic-update call.

---

## File map

| File | Action | Responsibility |
|---|---|---|
| `src/lib/tracker/types.ts` | Modify | `TOUR_KEYS`, `TOUR_STATUSES`, their types, `TourProgress`; `tours` on `DashboardData` |
| `src/lib/db/schema.ts` | Modify | `user_tour` table |
| `drizzle/0001_*.sql`, `drizzle/meta/*` | Create (generated) | Migration for `user_tour` |
| `src/lib/tracker/data.ts` | Modify | Load the user's tour rows into `DashboardData.tours` |
| `src/app/dashboard/actions.ts` | Modify | `markTour` server action |
| `src/app/dashboard/_components/tracker-context.tsx` | Modify | `tour` op, reducer case, `markTour` helper |
| `src/app/dashboard/_components/help/position.ts` | Create | Pure popup placement |
| `src/app/dashboard/_components/help/position.test.ts` | Create | Tests for `place` |
| `src/app/dashboard/_components/help/help-prompt.ts` | Create | Pure "what to show on load" decision |
| `src/app/dashboard/_components/help/help-prompt.test.ts` | Create | Tests for `helpPrompt` |
| `src/app/dashboard/_components/help/help-content.ts` | Create | All tip copy and tour definitions |
| `src/app/dashboard/_components/help/use-anchored-popover.ts` | Create | Keeps a `popover="auto"` element next to its button |
| `src/app/dashboard/_components/help/info-tip.tsx` | Create | The "?" button and its popover |
| `src/app/dashboard/_components/help/tour.tsx` | Create | `TourProvider`, `useTour`, the tour dialog and card |
| `src/app/dashboard/_components/help/help-menu.tsx` | Create | Header "Help" menu listing the tours |
| `src/app/dashboard/_components/help/reading-banner.tsx` | Create | "Reading the dashboard" offer |
| `src/app/dashboard/page.tsx` | Modify | Wrap `<Dashboard>` in `TourProvider` |
| `src/app/dashboard/_components/dashboard.tsx` | Modify | Help menu, banner, anchors on Settings and "+ Add earning" |
| `summary-card.tsx`, `progress-chart.tsx`, `insights.tsx`, `flights-section.tsx`, `headstarts-section.tsx`, `monthly-spend-section.tsx`, `travel-bonuses-section.tsx`, `ledger.tsx`, `entry-dialog.tsx`, `settings-dialog.tsx` (all in `src/app/dashboard/_components/`) | Modify | Tips and `data-help` anchors |

---

## Chunk 1: Data layer

### Task 1: Tour types, table, migration, and loading

**Files:**
- Modify: `src/lib/tracker/types.ts`
- Modify: `src/lib/db/schema.ts`
- Create (generated): `drizzle/0001_*.sql`, plus updates under `drizzle/meta/`
- Modify: `src/lib/tracker/data.ts`

- [ ] **Step 1: Add the tour constants and the `tours` field**

In `src/lib/tracker/types.ts`, add after the `TrackerCardInfo` interface:

```ts
// drizzle-kit loads this file through schema.ts and can't resolve `@/`, so its imports from `@/` must stay type-only.

/** Guided tours on the dashboard. Shared by the database schema, the server action, and the help content. */
export const TOUR_KEYS = ['adding-data', 'reading-dashboard', 'planning-ahead'] as const;
export type TourKey = (typeof TOUR_KEYS)[number];

/** Done saves `completed`; Skip, Esc, and the banner's "No thanks" save `dismissed`. */
export const TOUR_STATUSES = ['completed', 'dismissed'] as const;
export type TourStatus = (typeof TOUR_STATUSES)[number];

/** The user's status for each tour they've finished or dismissed. A missing key means never seen. */
export type TourProgress = Partial<Record<TourKey, TourStatus>>;
```

Add the field as the last member of `DashboardData`:

```ts
  entries: Entry[];
  tours: TourProgress;
}
```

- [ ] **Step 2: Add the `user_tour` table**

In `src/lib/db/schema.ts`, add an import below the existing `../engine/types` import. Use a relative path because drizzle-kit loads this file outside Next.js:

```ts
import { TOUR_KEYS, TOUR_STATUSES } from '../tracker/types';
```

Append at the end of the file:

```ts
/** Guided tours a user has finished or dismissed. Per user, not per tracker, so a new status year doesn't replay them. */
export const userTour = pgTable(
  'user_tour',
  {
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    tourKey: text('tour_key', { enum: TOUR_KEYS }).notNull(),
    status: text('status', { enum: TOUR_STATUSES }).notNull(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.tourKey] })],
);
```

`primaryKey`, `text` and `timestamp` are already imported.

- [ ] **Step 3: Generate the migration**

Run: `pnpm db:generate`
Expected: a new `drizzle/0001_<name>.sql`, plus updated `drizzle/meta/_journal.json` and a new `drizzle/meta/0001_snapshot.json`. The SQL should be:

```sql
CREATE TABLE "user_tour" (
	"user_id" text NOT NULL,
	"tour_key" text NOT NULL,
	"status" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_tour_user_id_tour_key_pk" PRIMARY KEY("user_id","tour_key")
);
--> statement-breakpoint
ALTER TABLE "user_tour" ADD CONSTRAINT "user_tour_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
```

If the SQL touches any other table, stop. The schema had drift before this change, so report it instead of committing it.

- [ ] **Step 4: Apply it to the development database**

First confirm `.env.local`'s `DATABASE_URL` is the Neon development branch (see "Before you start").
Run: `pnpm db:migrate`
Expected: finishes without errors.

- [ ] **Step 5: Load tour progress with the dashboard data**

In `src/lib/tracker/data.ts`, add `userTour` to the `@/lib/db/schema` import. Then add a sixth query to the `Promise.all` in `getDashboardData`, and return it:

```ts
  const [[p], tiers, cards, trackerCards, entries, tours] = await Promise.all([
    // …the five existing queries, unchanged…
    db.select({ tourKey: userTour.tourKey, status: userTour.status }).from(userTour).where(eq(userTour.userId, userId)),
  ]);

  return {
    // …existing fields, unchanged…
    entries: entries.map(toEngineEntry),
    tours: Object.fromEntries(tours.map((t) => [t.tourKey, t.status])),
  };
```

- [ ] **Step 6: Check types**

Run: `pnpm typecheck`
Expected: passes. `src/app/dashboard/export/route.ts` picks fields one by one, so `tours` doesn't end up in backups.

- [ ] **Step 7: Commit**

```bash
pnpm format
git add src/lib/tracker/types.ts src/lib/db/schema.ts src/lib/tracker/data.ts drizzle
git commit -m "Add user_tour table and load tour progress with the dashboard"
```

### Task 2: `markTour` action and the tracker context

**Files:**
- Modify: `src/app/dashboard/actions.ts`
- Modify: `src/app/dashboard/_components/tracker-context.tsx`

- [ ] **Step 1: Add the server action**

In `src/app/dashboard/actions.ts`:
- Add `userTour` to the `@/lib/db/schema` import.
- Add `import { TOUR_KEYS, TOUR_STATUSES, type TourKey, type TourStatus } from '@/lib/tracker/types';`.
- Append:

```ts
/** Saves that the user finished or dismissed a guided tour. Replaying a tour overwrites the row. */
export async function markTour(key: TourKey, status: TourStatus) {
  const user = await requireUser();
  const values = { userId: user.id, tourKey: z.enum(TOUR_KEYS).parse(key), status: z.enum(TOUR_STATUSES).parse(status) };
  await db
    .insert(userTour)
    .values(values)
    .onConflictDoUpdate({ target: [userTour.userId, userTour.tourKey], set: { status: values.status, updatedAt: new Date() } });
  refresh();
}
```

`refresh()` matters. `run` applies its update with `useOptimistic`, and that update is dropped when the transition ends. Without the refreshed server data, the banner would reappear.

- [ ] **Step 2: Add the op, the reducer case, and the helper**

In `src/app/dashboard/_components/tracker-context.tsx`:
- Change the existing type import to `import type { DashboardData, TourKey, TourStatus } from '@/lib/tracker/types';`.
- Add a member at the end of the `Op` union. Move the trailing `;` from the `cardIncluded` line to the new line:

```ts
  | { type: 'cardIncluded'; cardKey: string; included: boolean }
  | { type: 'tour'; key: TourKey; status: TourStatus };
```

Add a case to `reducer`:

```ts
    case 'tour':
      return { ...state, tours: { ...state.tours, [op.key]: op.status } };
```

Add to `TrackerContextValue`, after `setDate`:

```ts
  /** Saves a tour's status; the dashboard reflects it immediately. */
  markTour: (key: TourKey, status: TourStatus) => void;
```

Add to the object returned by the `useMemo`, after `setDate`:

```ts
      markTour: (key, status) => run({ type: 'tour', key, status }, () => actions.markTour(key, status)),
```

- [ ] **Step 3: Check types and lint**

Run: `pnpm typecheck && pnpm lint`
Expected: both pass.

- [ ] **Step 4: Commit**

```bash
pnpm format
git add src/app/dashboard/actions.ts src/app/dashboard/_components/tracker-context.tsx
git commit -m "Add markTour server action and optimistic tour updates"
```

---

## Chunk 2: Pure helpers (TDD)

### Task 3: `place()` positioning

**Files:**
- Create: `src/app/dashboard/_components/help/position.ts`
- Test: `src/app/dashboard/_components/help/position.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, expect, it } from 'vitest';
import { place } from './position';

const VIEWPORT = { width: 1000, height: 800 };
const POPUP = { width: 200, height: 100 };

describe('place', () => {
  it('centers the popup below the target by default', () => {
    expect(place({ top: 100, left: 100, width: 40, height: 20 }, POPUP, VIEWPORT)).toEqual({ side: 'bottom', top: 128, left: 20 });
  });

  it('flips above when the popup does not fit below and there is more room above', () => {
    expect(place({ top: 700, left: 100, width: 40, height: 20 }, POPUP, VIEWPORT)).toEqual({ side: 'top', top: 592, left: 20 });
  });

  it('stays below when neither side fits and below has more room, clamped inside the viewport', () => {
    const p = place({ top: 100, left: 100, width: 40, height: 20 }, { width: 200, height: 250 }, { width: 1000, height: 300 });
    expect(p).toEqual({ side: 'bottom', top: 42, left: 20 });
  });

  it('clamps horizontally at the left edge', () => {
    expect(place({ top: 100, left: 0, width: 20, height: 20 }, POPUP, VIEWPORT).left).toBe(8);
  });

  it('clamps horizontally at the right edge', () => {
    expect(place({ top: 100, left: 980, width: 20, height: 20 }, POPUP, VIEWPORT).left).toBe(792);
  });

  it('pins a popup taller than the viewport to the top margin', () => {
    expect(place({ top: 100, left: 100, width: 40, height: 20 }, { width: 200, height: 400 }, { width: 1000, height: 300 }).top).toBe(8);
  });

  it('uses the gap it is given', () => {
    expect(place({ top: 100, left: 100, width: 40, height: 20 }, POPUP, VIEWPORT, 12).top).toBe(132);
  });
});
```

- [ ] **Step 2: Run them and confirm they fail**

Run: `pnpm test src/app/dashboard/_components/help/position.test.ts`
Expected: FAIL, because `./position` can't be resolved.

- [ ] **Step 3: Implement**

```ts
export interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Placement {
  top: number;
  left: number;
  side: 'top' | 'bottom';
}

/** Closest a popup may come to the viewport's edges. */
const MARGIN = 8;

/**
 * Places a popup next to a target, in viewport coordinates. Prefers below the target, flips above when the
 * popup doesn't fit below and there's more room above, then clamps both axes inside the viewport.
 */
export function place(target: Rect, popup: Size, viewport: Size, gap = 8): Placement {
  const below = viewport.height - (target.top + target.height) - gap - MARGIN;
  const above = target.top - gap - MARGIN;
  const side = popup.height > below && above > below ? 'top' : 'bottom';
  const top = side === 'bottom' ? target.top + target.height + gap : target.top - gap - popup.height;
  const left = target.left + target.width / 2 - popup.width / 2;
  return {
    side,
    top: clamp(top, MARGIN, viewport.height - popup.height - MARGIN),
    left: clamp(left, MARGIN, viewport.width - popup.width - MARGIN),
  };
}

/** Keeps value within [min, max]; when the popup is bigger than the room (max < min), min wins. */
function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(value, max));
}
```

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `pnpm test src/app/dashboard/_components/help/position.test.ts`
Expected: 7 passed.

- [ ] **Step 5: Commit**

```bash
pnpm format
git add src/app/dashboard/_components/help/position.ts src/app/dashboard/_components/help/position.test.ts
git commit -m "Add popup placement helper for tips and tours"
```

### Task 4: `helpPrompt()` decision

**Files:**
- Create: `src/app/dashboard/_components/help/help-prompt.ts`
- Test: `src/app/dashboard/_components/help/help-prompt.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, expect, it } from 'vitest';
import type { Entry, EntryState } from '@/lib/engine';
import { helpPrompt } from './help-prompt';

const entry = (state: EntryState = 'Planned'): Entry => ({
  id: crypto.randomUUID(),
  program: 'DL',
  category: 'Flights',
  state,
  date: '2027-03-01',
  description: 'ATL-LAX',
  method: 'fare',
  amount: 400,
  rate: 1,
  override: null,
  notes: '',
});
const entries = (n: number) => Array.from({ length: n }, () => entry());

describe('helpPrompt', () => {
  it('starts "Adding your data" for a new, empty account', () => {
    expect(helpPrompt({ tours: {}, entries: [] })).toBe('start-adding-data');
  });

  it('treats an account with only cancelled entries as empty', () => {
    expect(helpPrompt({ tours: {}, entries: [entry('Cancelled'), entry('Cancelled'), entry('Cancelled')] })).toBe('start-adding-data');
  });

  it('shows nothing below three entries once the account has data', () => {
    expect(helpPrompt({ tours: {}, entries: entries(2) })).toBeNull();
  });

  it('offers "Reading the dashboard" at three entries', () => {
    expect(helpPrompt({ tours: {}, entries: entries(3) })).toBe('offer-reading');
  });

  it('offers reading, not the first tour, to an existing user who has data but no saved tours', () => {
    expect(helpPrompt({ tours: {}, entries: entries(5) })).toBe('offer-reading');
  });

  it('does not restart "Adding your data" once it is saved', () => {
    expect(helpPrompt({ tours: { 'adding-data': 'dismissed' }, entries: [] })).toBeNull();
    expect(helpPrompt({ tours: { 'adding-data': 'completed' }, entries: entries(2) })).toBeNull();
  });

  it('still offers reading after "Adding your data" is saved', () => {
    expect(helpPrompt({ tours: { 'adding-data': 'completed' }, entries: entries(3) })).toBe('offer-reading');
  });

  it('shows nothing once both tours are saved', () => {
    expect(helpPrompt({ tours: { 'adding-data': 'completed', 'reading-dashboard': 'dismissed' }, entries: entries(3) })).toBeNull();
  });
});
```

- [ ] **Step 2: Run them and confirm they fail**

Run: `pnpm test src/app/dashboard/_components/help/help-prompt.test.ts`
Expected: FAIL, because `./help-prompt` can't be resolved.

- [ ] **Step 3: Implement**

```ts
import type { Entry } from '@/lib/engine';
import type { TourProgress } from '@/lib/tracker/types';

export type HelpPrompt = 'start-adding-data' | 'offer-reading' | null;

/** Entries an account needs before the chart and breakdown have something to explain. */
export const READING_OFFER_MIN_ENTRIES = 3;

/**
 * What the dashboard offers on load. A new, empty account starts "Adding your data". An account with some
 * data is offered "Reading the dashboard" instead, so existing users never land in the first-visit tour.
 */
export function helpPrompt({ tours, entries }: { tours: TourProgress; entries: Entry[] }): HelpPrompt {
  const count = entries.filter((e) => e.state !== 'Cancelled').length;
  if (!tours['adding-data'] && count === 0) return 'start-adding-data';
  if (!tours['reading-dashboard'] && count >= READING_OFFER_MIN_ENTRIES) return 'offer-reading';
  return null;
}
```

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `pnpm test src/app/dashboard/_components/help/help-prompt.test.ts`
Expected: 8 passed.

- [ ] **Step 5: Commit**

```bash
pnpm format
git add src/app/dashboard/_components/help/help-prompt.ts src/app/dashboard/_components/help/help-prompt.test.ts
git commit -m "Add helpPrompt to decide which tour to start or offer"
```

---

## Chunk 3: Tips

### Task 5: Help content

**Files:**
- Create: `src/app/dashboard/_components/help/help-content.ts`

This is draft copy. Karl reviews it before the PR merges (Task 11). Every tour step's `target` must match a `data-help` attribute added in Task 8.

- [ ] **Step 1: Write the file**

```ts
import type { TourKey } from '@/lib/tracker/types';

export interface Tip {
  title: string;
  body: string;
}

export interface TourStep {
  /** The `data-help` id of the element to highlight. */
  target: string;
  title: string;
  body: string;
  /** Opens the Add earning dialog before this step, when it isn't open already. */
  before?: 'openEntry';
}

export interface Tour {
  title: string;
  steps: TourStep[];
}

export const TIPS = {
  'summary.goal': {
    title: 'Your goal',
    body: 'The MQD target you are working toward this year, usually a Medallion tier threshold. Change it in Settings.',
  },
  'summary.posted': {
    title: 'Posted MQDs',
    body: 'MQDs Delta has already credited to your SkyMiles account. Only posted MQDs count toward status today. Mark entries credited when they appear in your account.',
  },
  'summary.forecast': {
    title: 'Total forecast',
    body: 'Posted MQDs plus everything still expected: pending, projected, and potential entries. It is where you would finish the year if your plans happen.',
  },
  'summary.gap': {
    title: 'Actual and forecast gap',
    body: 'Actual gap: MQDs still needed beyond what has posted. Forecast gap: MQDs still needed beyond everything you have planned. A forecast gap of 0 means your plans cover the goal.',
  },
  'summary.pace': {
    title: 'Monthly pace',
    body: 'The actual gap spread evenly across the months left, counting from the as-of date in Settings. Roughly how much needs to post each month to stay on track.',
  },
  'summary.tiers': {
    title: 'Tier progress',
    body: 'Earned means your posted MQDs reach the tier. Projected means your total forecast reaches it. These reflect this year’s tracked earnings, not any status you hold now.',
  },
  'chart.lines': {
    title: 'Reading the chart',
    body: 'Month-end totals as a share of your goal. Solid line: posted. Dashed line: total forecast. Dotted line: an even pace from zero to your goal. Above the dotted line means you are ahead of pace.',
  },
  breakdown: {
    title: 'Where earnings come from',
    body: 'Your MQDs by source. Actual counts posted entries only. Forecast adds pending, projected, and potential entries.',
  },
  mix: {
    title: 'Earning mix',
    body: 'A what-if planner. It takes the gap your forecast leaves, splits it between flights and card spend, and shows the fares or spend that would close it. Nothing here is saved.',
  },
  'flights.states': {
    title: 'Flight states',
    body: 'Potential: an idea, not booked yet. Booked moves a flight to Projected. Credited moves its MQDs to posted once Delta credits them. Every state except Cancelled counts in the forecast.',
  },
  headstarts: {
    title: 'MQD Headstarts',
    body: 'Some Delta SkyMiles American Express cards add MQDs each year just for holding the card. Mark a Headstart credited when it appears in your SkyMiles account.',
  },
  'monthly-spend': {
    title: 'Monthly card spend',
    body: 'Enter eligible spend for each month and the tracker estimates MQDs at the card’s rate. The second field takes the exact MQDs Delta posts; leave it blank to use the estimate. Edits count once you select Save changes.',
  },
  'travel-bonuses': {
    title: 'Stays and rental bonuses',
    body: 'Some Delta Stays bookings and rental car offers award bonus MQDs. Add them here and mark them credited when they post.',
  },
  'ledger.states': {
    title: 'Activity states',
    body: 'Potential: not booked yet. Projected: booked or expected. Pending: done, waiting for Delta to post it. Posted: credited to your account. Card excluded: from a card you’re considering but haven’t included. A ≈ next to the MQDs means the number is calculated, not entered from Delta.',
  },
  'entry.method': {
    title: 'Calculation method',
    body: 'How MQDs are worked out for this entry. For a Delta flight, MQDs equal the eligible fare in dollars. Pick Exact / manual MQDs if you already know the number.',
  },
  'entry.amount': {
    title: 'Amount',
    body: 'What the method calculates from. For a Delta fare, the eligible fare: base fare plus carrier-imposed surcharges, without government taxes and fees. For card spend, the eligible dollars spent. For exact and bonus methods, enter the MQDs themselves.',
  },
  'entry.override': {
    title: 'Posted / exact MQDs',
    body: 'Leave blank to use the calculation. Once Delta posts the entry, enter the MQDs it shows so your totals match your account.',
  },
  'settings.asof': {
    title: 'As-of date',
    body: 'The date your monthly pace counts from. It does not move on its own, so set it to today to see the pace from now, or to a later date to plan ahead.',
  },
  'settings.cards': {
    title: 'Your Delta cards',
    body: 'I have it: the card’s Headstart and spend planner count in your totals. Considering: they show on the dashboard but stay out of totals until you include them. Don’t have: removes the card and deletes its Headstart and monthly spend entries.',
  },
} satisfies Record<string, Tip>;

export type TipId = keyof typeof TIPS;

export const TOURS: Record<TourKey, Tour> = {
  'adding-data': {
    title: 'Adding your data',
    steps: [
      {
        target: 'settings',
        title: 'Start with your cards',
        body: 'Open Settings to pick your goal tier and the Delta cards you have or are considering. Cards you have add their Headstart to your forecast automatically.',
      },
      {
        target: 'headstarts',
        title: 'Card Headstarts',
        body: 'Each card’s Headstart shows here. Mark it credited when it posts to your SkyMiles account.',
      },
      {
        target: 'monthly-spend',
        title: 'Monthly card spend',
        body: 'Plan eligible spend for each month. The tracker estimates the MQDs, and you can enter the exact credit once Delta posts it.',
      },
      {
        target: 'add-earning',
        title: 'Flights and bonuses',
        body: 'Use + Add earning for flights, Delta Stays and rental bonuses, or anything else that earns MQDs. Here’s what’s inside.',
      },
      {
        target: 'entry.category',
        before: 'openEntry',
        title: 'Category',
        body: 'What kind of earning this is. We’ve started you on Flights.',
      },
      {
        target: 'entry.method',
        title: 'Calculation method',
        body: 'For a Delta flight, MQDs equal the eligible fare. If you already know the MQDs, pick Exact / manual instead.',
      },
      {
        target: 'entry.route',
        title: 'Route',
        body: 'Optional. Airport codes like DCA-ATL name the flight and put it on your map. Tick Round trip for a return on the same route.',
      },
      {
        target: 'entry.amount',
        title: 'Eligible fare',
        body: 'The base fare plus carrier-imposed surcharges, in dollars. Government taxes and fees don’t earn MQDs, so leave them out.',
      },
      {
        target: 'entry.state',
        title: 'Earning state',
        body: 'Projected: booked, not flown. Pending: flown, waiting on Delta. Posted: credited. For a trip you haven’t booked, save it and switch Booked off on its flight card to make it Potential. Now add your first flight.',
      },
    ],
  },
  'reading-dashboard': {
    title: 'Reading the dashboard',
    steps: [
      {
        target: 'summary',
        title: 'Your status at a glance',
        body: 'The big number is your posted MQDs against your goal. Below it, the same progress as a bar: solid for posted, lighter for your forecast.',
      },
      {
        target: 'summary.gap',
        title: 'Gaps and pace',
        body: 'Actual gap: still needed beyond what’s posted. Forecast gap: still needed beyond everything planned. The line underneath is the monthly pace to close the actual gap.',
      },
      {
        target: 'summary.bar',
        title: 'Tier markers',
        body: 'Each marker is a Medallion tier. A filled marker is earned from posted MQDs; an outlined red one is reached by your forecast. ★ marks your goal.',
      },
      {
        target: 'summary.tiers',
        title: 'Tier tiles',
        body: 'Every tier marked Earned, Projected, or Not reached, with your goal labeled.',
      },
      {
        target: 'chart',
        title: 'Projected totals',
        body: 'Month-end progress as a share of your goal. Solid: posted. Dashed: total forecast. Dotted: an even pace to the goal. Above the dotted line means you’re ahead.',
      },
      {
        target: 'breakdown',
        title: 'Where earnings come from',
        body: 'Posted and forecast MQDs by source, so you can see what’s carrying your year.',
      },
    ],
  },
  'planning-ahead': {
    title: 'Planning ahead',
    steps: [
      {
        target: 'mix',
        title: 'Find your earning mix',
        body: 'Move the slider to split your remaining gap between flights and card spend, and see the fares or spend you’d need. Nothing here is saved.',
      },
      {
        target: 'flights',
        title: 'Potential vs Posted',
        body: 'Potential flights count in your forecast but not in posted MQDs. To test a trip you’re considering, add it and switch Booked off on its flight card.',
      },
      {
        target: 'ledger',
        title: 'Earning activity',
        body: 'Every entry in one list. Filter by state to see what’s still waiting to post, and edit entries to match what Delta credits.',
      },
    ],
  },
};
```

- [ ] **Step 2: Check types**

Run: `pnpm typecheck`
Expected: passes.

- [ ] **Step 3: Commit**

```bash
pnpm format
git add src/app/dashboard/_components/help/help-content.ts
git commit -m "Add draft help copy and tour definitions"
```

### Task 6: `useAnchoredPopover` and `InfoTip`

**Files:**
- Create: `src/app/dashboard/_components/help/use-anchored-popover.ts`
- Create: `src/app/dashboard/_components/help/info-tip.tsx`

Background:
- **Why `popovertarget`:** the button is linked to its popover with `popovertarget`. That way the browser treats the button as the popover's invoker. A click on it toggles the popover instead of light-dismissing it and reopening it straight away. The browser also reports the expanded state, so `aria-expanded` isn't set by hand.
- **Why the hide before positioning:** the `toggle` event fires after the popover opens, which may be after a paint. So `beforetoggle` hides the popover until it has been positioned.

- [ ] **Step 1: Write the hook**

```ts
'use client';

import { useEffect, useRef, useState } from 'react';
import { place } from './position';

/**
 * Keeps a popover="auto" element next to the button that toggles it (via popovertarget), and keeps it there
 * while the page or a dialog scrolls.
 */
export function useAnchoredPopover<A extends HTMLElement, P extends HTMLElement>() {
  const anchorRef = useRef<A>(null);
  const popoverRef = useRef<P>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const popover = popoverRef.current;
    if (!popover) return;
    const beforeToggle = (e: Event) => {
      if ((e as ToggleEvent).newState === 'open') popover.style.visibility = 'hidden';
    };
    const toggle = (e: Event) => {
      const isOpen = (e as ToggleEvent).newState === 'open';
      if (isOpen) {
        position(anchorRef.current, popover);
        popover.style.visibility = '';
      }
      setOpen(isOpen);
    };
    popover.addEventListener('beforetoggle', beforeToggle);
    popover.addEventListener('toggle', toggle);
    return () => {
      popover.removeEventListener('beforetoggle', beforeToggle);
      popover.removeEventListener('toggle', toggle);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const update = () => position(anchorRef.current, popoverRef.current);
    window.addEventListener('resize', update);
    // Capture phase, so scrolling inside a dialog (which doesn't bubble to window) also moves the popover.
    document.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      document.removeEventListener('scroll', update, true);
    };
  }, [open]);

  return { anchorRef, popoverRef };
}

function position(anchor: HTMLElement | null, popover: HTMLElement | null) {
  if (!anchor || !popover) return;
  const p = place(anchor.getBoundingClientRect(), popover.getBoundingClientRect(), { width: innerWidth, height: innerHeight });
  popover.style.top = `${p.top}px`;
  popover.style.left = `${p.left}px`;
}
```

- [ ] **Step 2: Write `InfoTip`**

```tsx
'use client';

import { useId } from 'react';
import { TIPS, type TipId } from './help-content';
import { useAnchoredPopover } from './use-anchored-popover';

/**
 * A "?" button that toggles a short explanation. The browser closes it on Esc, an outside click, or when
 * another tip opens. Everything is phrasing content, so it can sit inside headings, paragraphs, and legends.
 */
export function InfoTip({ id }: { id: TipId }) {
  const tip = TIPS[id];
  const popoverId = useId();
  const { anchorRef, popoverRef } = useAnchoredPopover<HTMLButtonElement, HTMLSpanElement>();

  return (
    <>
      <button
        ref={anchorRef}
        type="button"
        popoverTarget={popoverId}
        aria-label={`About ${tip.title}`}
        className="relative ml-1.5 inline-flex size-[18px] shrink-0 items-center justify-center rounded-full border border-current align-middle text-[11px] font-bold normal-case leading-none tracking-normal opacity-60 before:absolute before:-inset-1.5 hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        <span aria-hidden>?</span>
      </button>
      <span
        ref={popoverRef}
        id={popoverId}
        popover="auto"
        className="fixed inset-auto m-0 w-72 max-w-[calc(100vw-16px)] rounded-lg border border-line bg-surface p-3 text-left text-xs font-normal normal-case leading-relaxed tracking-normal text-foreground shadow-lg"
      >
        <strong className="mb-1 block text-[13px] font-semibold">{tip.title}</strong>
        {tip.body}
      </span>
    </>
  );
}
```

How the styling works:
- The `before:` pseudo-element enlarges the tap target to about 30px without changing the layout.
- The button uses `border-current`, so it reads as white on the summary card's dark header and dark grey elsewhere.
- The popover resets the text styles it would otherwise inherit from headings: weight, case, letter spacing, and color.

- [ ] **Step 3: Check types and lint**

Run: `pnpm typecheck && pnpm lint`
Expected: both pass.

- [ ] **Step 4: Commit**

```bash
pnpm format
git add src/app/dashboard/_components/help/use-anchored-popover.ts src/app/dashboard/_components/help/info-tip.tsx
git commit -m "Add InfoTip toggletip on the Popover API"
```

### Task 7: Place the tips

**Files (all in `src/app/dashboard/_components/`):** `summary-card.tsx`, `progress-chart.tsx`, `insights.tsx`, `flights-section.tsx`, `headstarts-section.tsx`, `monthly-spend-section.tsx`, `travel-bonuses-section.tsx`, `ledger.tsx`, `entry-dialog.tsx`, `settings-dialog.tsx`

In each file, add `import { InfoTip } from './help/info-tip';`, then make the edits below.

- [ ] **Step 1: Summary card (`summary-card.tsx`)**
  - Inside the `<h2>`: `Medallion Status<InfoTip id="summary.goal" />`.
  - Inside the posted line: `Posted {unit} · {percent(s.postedPercent)} of goal<InfoTip id="summary.posted" />`.
  - Inside the total forecast `<span>`, after the closing `)`: `<InfoTip id="summary.forecast" />`.
  - In the gap grid's `.map`, right after `<small className="text-xs text-muted">{label}</small>`: `{label === 'Forecast gap' && <InfoTip id="summary.gap" />}`.
  - At the end of the monthly pace `<p>`, after the conditional text: `<InfoTip id="summary.pace" />`.
  - After the text "Earned from posted credit": `<InfoTip id="summary.tiers" />`.
  - Leave the tier marker `title` in `StatusBar` as it is (the spec keeps it).

- [ ] **Step 2: Panel headings.** Pass a fragment as `PanelHead`'s `title`:
  - `progress-chart.tsx`: `title={<>{data.tracker.statusYear} projected totals<InfoTip id="chart.lines" /></>}`
  - `insights.tsx` `Breakdown`: `title={<>Where earnings come from<InfoTip id="breakdown" /></>}`
  - `insights.tsx` `EarningMix`: `title={<>Find your earning mix<InfoTip id="mix" /></>}`
  - `flights-section.tsx`: `title={<>Planned flights &amp; account credit<InfoTip id="flights.states" /></>}`
  - `headstarts-section.tsx`: `title={<>Card MQD Headstarts<InfoTip id="headstarts" /></>}`
  - `monthly-spend-section.tsx`: `title={<>Monthly credit-card earnings<InfoTip id="monthly-spend" /></>}`. Also delete `title="Exact credit (optional). Blank uses the spend estimate."` from the exact-MQD `<input>`, because the tip replaces it. Keep its `aria-label`.
  - `travel-bonuses-section.tsx`: `title={<>Delta Stays &amp; rental car bonus MQDs<InfoTip id="travel-bonuses" /></>}`
  - `ledger.tsx`: `title={<>Earning activity<InfoTip id="ledger.states" /></>}`. Keep the "≈" `title` (the spec keeps it).

- [ ] **Step 3: Entry dialog (`entry-dialog.tsx`).** Put the tip next to the label, never inside it. For the method, amount, and override fields, wrap the existing `<label>` in a row:

```tsx
          <div className="mb-1.5 flex items-center">
            <label htmlFor="f-method" className="text-xs font-semibold">
              Calculation method
            </label>
            <InfoTip id="entry.method" />
          </div>
```

The label's class is `labelClass` without its `mb-1.5 block`. The margin moves to the row, so the label and the "?" are centered on one line. Don't stack `mb-0` on top of `labelClass`: two margin utilities on one element depend on CSS order, not class order.

Do the same for `f-amount` (`<InfoTip id="entry.amount" />`, keeping `{method.amountLabel}` as the label text) and `f-override` (`<InfoTip id="entry.override" />`).

- [ ] **Step 4: Settings dialog (`settings-dialog.tsx`)**
  - Wrap the `s-asof` label the same way, with `<InfoTip id="settings.asof" />`.
  - Inside the `<legend>`: `Your Delta cards<InfoTip id="settings.cards" />`.

- [ ] **Step 5: Check types and lint**

Run: `pnpm typecheck && pnpm lint`
Expected: both pass. A wrong tip id is a type error, because `id` is `TipId`.

- [ ] **Step 6: Check in the browser**

Start the dev server (`pnpm dev`, or `preview_start` in the browser pane) and sign in with the account in `.env.local` (`E2E_TEST_EMAIL` / `E2E_TEST_PASSWORD`).

At 1280px and at 375px wide:
- **Basic behavior:** every "?" opens on click or tap. Clicking it again closes it, and so do Esc and an outside click. Opening one tip closes any other.
- **Near the edges:** tips stay on screen near the screen edges, including the summary header's tip.
- **In the dialogs:** the entry and settings dialog tips open on top of their dialog. They stay next to their button while the dialog scrolls.
- **Headings:** the tips don't change the headings' layout beyond the small icon.
- **Console:** check `read_console_messages` for hydration errors. A `<div>` inside a `<p>` would cause one; `InfoTip` only renders a `<button>` and a `<span>`.

- [ ] **Step 7: Commit**

```bash
pnpm format
git add src/app/dashboard/_components
git commit -m "Add help tips across the dashboard and dialogs"
```

---

## Chunk 4: Tours

### Task 8: `data-help` anchors

**Files (all in `src/app/dashboard/_components/`):** `dashboard.tsx`, `summary-card.tsx`, `progress-chart.tsx`, `insights.tsx`, `flights-section.tsx`, `headstarts-section.tsx`, `monthly-spend-section.tsx`, `ledger.tsx`, `entry-dialog.tsx`

`Panel` spreads its props onto its `<section>`, so `data-help` can go straight on `<Panel>`.

- [ ] **Step 1: Add the attributes**

| File | Element | Attribute |
|---|---|---|
| `dashboard.tsx` | header Settings `<button>` | `data-help="settings"` |
| `dashboard.tsx` | header "+ Add earning" `<button>` | `data-help="add-earning"` |
| `summary-card.tsx` | root `<article>` | `data-help="summary"` |
| `summary-card.tsx` | gap box `<div className="mt-5 rounded-lg border-l-[3px] …">` | `data-help="summary.gap"` |
| `summary-card.tsx` | `StatusBar`'s `<div aria-label="Progress across status tiers">` | `data-help="summary.bar"` |
| `summary-card.tsx` | tier tiles `<div className="grid grid-cols-2 gap-2 sm:grid-cols-4">` | `data-help="summary.tiers"` |
| `progress-chart.tsx` | `<Panel>` | `data-help="chart"` |
| `insights.tsx` | `Breakdown`'s `<Panel>` | `data-help="breakdown"` |
| `insights.tsx` | `EarningMix`'s `<Panel>` | `data-help="mix"` |
| `flights-section.tsx` | `<Panel>` | `data-help="flights"` |
| `headstarts-section.tsx` | `<Panel>` | `data-help="headstarts"` |
| `monthly-spend-section.tsx` | `MonthlySpendSection`'s `<Panel>` | `data-help="monthly-spend"` |
| `ledger.tsx` | `<Panel>` | `data-help="ledger"` (not on its own "+ Add earning" button) |
| `entry-dialog.tsx` | wrapper `<div>` of `f-category` | `data-help="entry.category"` |
| `entry-dialog.tsx` | wrapper `<div>` of `f-state` | `data-help="entry.state"` |
| `entry-dialog.tsx` | grid-cell `<div>` holding both the label row and the `f-method` `<select>` (not the label row Task 7 added) | `data-help="entry.method"` |
| `entry-dialog.tsx` | wrapper `<div className="sm:col-span-2">` of `f-route` | `data-help="entry.route"` |
| `entry-dialog.tsx` | grid-cell `<div>` holding both the label row and the `f-amount` `<input>` (not the label row) | `data-help="entry.amount"` |

- [ ] **Step 2: Check every tour target has an anchor**

Run this from the repo root:

```bash
for t in $(grep -o "target: '[^']*'" src/app/dashboard/_components/help/help-content.ts | cut -d"'" -f2); do
  grep -rq "data-help=\"$t\"" src/app/dashboard/_components || echo "missing anchor: $t"
done
```

Expected: no output.

- [ ] **Step 3: Check types and lint, then commit**

```bash
pnpm typecheck && pnpm lint
pnpm format
git add src/app/dashboard/_components
git commit -m "Add data-help anchors for tour steps"
```

### Task 9: The tour engine

**Files:**
- Create: `src/app/dashboard/_components/help/tour.tsx`
- Modify: `src/app/dashboard/page.tsx`

How it works (the spec's "Tour dialog" section has the reasons):
- **The tour is a modal `<dialog>`.** It fills the viewport and is transparent. While it's open, the page and any entry dialog under it are inert.
- **Highlight:** a "hole" `<div>` with a huge `box-shadow` dims everything except the target.
- **Dialog steps:**
  1. A step with `before: 'openEntry'` opens the entry dialog.
  2. The tour then waits, checking once per frame for up to 1 second, until the target is inside a dialog that matches `:modal`.
  3. It then closes and re-shows itself with `showModal()`, which puts it above the entry dialog.
  4. Every later step whose target is inside a dialog re-shows the tour the same way.
- **Ending:**
  - The tour ends only from its buttons or the dialog's `cancel` event (Esc).
  - It never ends from `close`, because the re-show fires `close` too.
- **Lint-safe effects:**
  - All per-step work runs inside `requestAnimationFrame` callbacks.
  - Positions are written straight to element styles through refs, never set as state from an effect.

- [ ] **Step 1: Write `tour.tsx`**

```tsx
'use client';

import { createContext, use, useCallback, useEffect, useEffectEvent, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import { buttonClass } from '@/components/ui';
import type { TourKey, TourStatus } from '@/lib/tracker/types';
import { useTracker } from '../tracker-context';
import { TOURS, type TourStep } from './help-content';
import { helpPrompt } from './help-prompt';
import { place } from './position';

/** How long a step waits for the entry dialog and its field before the tour gives up. */
const WAIT_MS = 1000;
/** Space between the highlighted element and the edge of the cutout. */
const PAD = 6;
/** Same preset as the flights panel's "+ Add flight" button. */
const ENTRY_PRESET = { category: 'Flights', method: 'fare', title: 'Add flight' } as const;

type Run = { key: TourKey; index: number; dir: 1 | -1 };

interface TourContextValue {
  start: (key: TourKey) => void;
  active: TourKey | null;
}

const TourContext = createContext<TourContextValue | null>(null);

export function useTour() {
  const ctx = use(TourContext);
  if (!ctx) throw new Error('useTour must be used within TourProvider');
  return ctx;
}

const findTarget = (step: TourStep) => document.querySelector<HTMLElement>(`[data-help="${step.target}"]`);
const inModalDialog = (el: HTMLElement | null) => !!el?.closest('dialog')?.matches(':modal');

export function TourProvider({ children }: { children: ReactNode }) {
  const { data, openEntry, closeEntry, markTour } = useTracker();
  // A new, empty account starts "Adding your data" straight away. Lazy state runs once (StrictMode can't
  // start it twice) and matches the server render.
  const [run, setRun] = useState<Run | null>(() =>
    helpPrompt({ tours: data.tours, entries: data.entries }) === 'start-adding-data' ? { key: 'adding-data', index: 0, dir: 1 } : null,
  );
  const dialogRef = useRef<HTMLDialogElement>(null);
  const holeRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLButtonElement>(null);
  const primaryRef = useRef<HTMLButtonElement>(null);
  const targetRef = useRef<HTMLElement | null>(null);
  /** True while the entry dialog is open because this tour opened it. */
  const openedEntry = useRef(false);
  /** True from a step change until that step is presented; Back and Next do nothing meanwhile. */
  const waiting = useRef(run !== null);
  const titleId = useId();

  /** Closes the tour without saving anything. Closes the entry dialog too if the tour opened it. */
  function leave() {
    if (openedEntry.current) closeEntry();
    openedEntry.current = false;
    waiting.current = false;
    targetRef.current = null;
    dialogRef.current?.close();
    setRun(null);
  }

  function end(status: TourStatus) {
    if (!run) return;
    markTour(run.key, status);
    // Done leaves the entry dialog open so the user can add a real entry; Skip and Esc close it.
    if (status === 'completed') openedEntry.current = false;
    leave();
  }

  function go(dir: 1 | -1) {
    if (!run || waiting.current) return;
    if (dir === 1 && run.index === TOURS[run.key].steps.length - 1) return end('completed');
    // Ignore further clicks until the next step is presented, so a double click can't skip past the dialog steps.
    waiting.current = true;
    setRun({ ...run, index: run.index + dir, dir });
  }

  const enterStep = useEffectEvent((current: Run) => {
    const steps = TOURS[current.key].steps;
    const step = steps[current.index];
    const firstEntryStep = steps.findIndex((s) => s.before === 'openEntry');
    const deadline = performance.now() + WAIT_MS;
    let frame = 0;

    // The step's target isn't on the page: move on in the same direction.
    const pass = () => {
      const index = current.index + current.dir;
      if (index >= steps.length) end('completed');
      else if (index < 0) leave();
      else setRun({ ...current, index });
    };

    const present = (el: HTMLElement) => {
      const dialog = dialogRef.current;
      if (!dialog) return;
      waiting.current = false;
      dialog.removeAttribute('data-waiting');
      targetRef.current = el;
      el.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
      // A target inside the entry dialog: show the tour again so it's the topmost modal and takes input.
      if (dialog.open && el.closest('dialog')) dialog.close();
      if (!dialog.open) dialog.showModal();
      measure(el, holeRef.current, cardRef.current);
      if (backRef.current) backRef.current.disabled = !steps.slice(0, current.index).some((s) => findTarget(s));
      primaryRef.current?.focus();
    };

    const attempt = () => {
      const el = findTarget(step);
      if (el && (!step.before || inModalDialog(el))) return present(el);
      if (!step.before) return pass();
      if (performance.now() > deadline) return leave();
      frame = requestAnimationFrame(attempt);
    };

    frame = requestAnimationFrame(() => {
      // Going back out of the dialog part of the tour: close the dialog the tour opened.
      if (firstEntryStep !== -1 && current.index < firstEntryStep && openedEntry.current) {
        openedEntry.current = false;
        closeEntry();
      }
      if (step.before === 'openEntry' && !inModalDialog(findTarget(step))) {
        waiting.current = true;
        dialogRef.current?.setAttribute('data-waiting', '');
        openEntry(undefined, ENTRY_PRESET);
        openedEntry.current = true;
      }
      attempt();
    });
    return () => cancelAnimationFrame(frame);
  });

  useEffect(() => {
    if (!run) return;
    return enterStep(run);
  }, [run]);

  useEffect(() => {
    if (!run) return;
    const update = () => measure(targetRef.current, holeRef.current, cardRef.current);
    window.addEventListener('resize', update);
    // Capture phase, so scrolling inside the entry dialog also re-measures.
    document.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      document.removeEventListener('scroll', update, true);
    };
  }, [run]);

  const start = useCallback((key: TourKey) => {
    openedEntry.current = false;
    waiting.current = true;
    setRun({ key, index: 0, dir: 1 });
  }, []);
  const active = run?.key ?? null;
  const value = useMemo(() => ({ start, active }), [start, active]);

  const steps = run ? TOURS[run.key].steps : [];
  const step = run ? steps[run.index] : undefined;

  return (
    <TourContext value={value}>
      {children}
      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        onCancel={() => end('dismissed')}
        className="fixed inset-0 m-0 size-full max-h-none max-w-none overflow-hidden border-0 bg-transparent p-0 text-foreground backdrop:bg-transparent data-[waiting]:invisible"
      >
        {run && step && (
          <>
            <div ref={holeRef} aria-hidden className="pointer-events-none fixed rounded-xl shadow-[0_0_0_9999px_#152a358c] outline-2 outline-white" />
            <div ref={cardRef} className="fixed inset-x-4 bottom-4 rounded-2xl border border-line bg-surface p-5 shadow-xl sm:inset-auto sm:w-80">
              <p className="text-[11px] font-bold uppercase tracking-[2px] text-accent">
                {TOURS[run.key].title} · {run.index + 1} of {steps.length}
              </p>
              <h2 id={titleId} className="mt-1.5 text-base font-semibold">
                {step.title}
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{step.body}</p>
              <div className="mt-4 flex items-center gap-2">
                <button type="button" className={buttonClass.link} onClick={() => end('dismissed')}>
                  Skip tour
                </button>
                <button ref={backRef} type="button" className={`${buttonClass.secondary} ml-auto`} onClick={() => go(-1)}>
                  Back
                </button>
                <button ref={primaryRef} type="button" className={buttonClass.dark} onClick={() => go(1)}>
                  {run.index === steps.length - 1 ? 'Done' : 'Next'}
                </button>
              </div>
            </div>
          </>
        )}
      </dialog>
    </TourContext>
  );
}

/** Draws the cutout around the target and places the card next to it. Below 640px, CSS docks the card to the bottom. */
function measure(target: HTMLElement | null, hole: HTMLElement | null, card: HTMLElement | null) {
  if (!target || !hole || !card) return;
  const r = target.getBoundingClientRect();
  const cut = { top: r.top - PAD, left: r.left - PAD, width: r.width + PAD * 2, height: r.height + PAD * 2 };
  Object.assign(hole.style, { top: `${cut.top}px`, left: `${cut.left}px`, width: `${cut.width}px`, height: `${cut.height}px` });
  if (!matchMedia('(min-width: 640px)').matches) {
    card.style.top = card.style.left = '';
    return;
  }
  const p = place(cut, card.getBoundingClientRect(), { width: innerWidth, height: innerHeight }, 12);
  card.style.top = `${p.top}px`;
  card.style.left = `${p.left}px`;
}
```

- [ ] **Step 2: Wrap the dashboard**

In `src/app/dashboard/page.tsx`, import `TourProvider` from `./_components/help/tour` and nest it inside `TrackerProvider`:

```tsx
    <TrackerProvider initial={data}>
      <TourProvider>
        <Dashboard userEmail={user.email} />
      </TourProvider>
    </TrackerProvider>
```

- [ ] **Step 3: Check types and lint**

Run: `pnpm typecheck && pnpm lint`
Expected: both pass.
- If `react-hooks/set-state-in-effect` flags `enterStep`, check that every `setRun` call is reached only from inside a `requestAnimationFrame` callback.
- If `react-hooks/exhaustive-deps` asks for `enterStep` in the deps, it's the wrong plugin version: effect events must be left out of deps. Report it rather than adding the dep.

- [ ] **Step 4: Check the first-visit tour in the browser**

You need an account with no entries and no tour rows. Either:
- sign up a new test account at `/sign-up` on localhost, and record its email and password in `.env.local` as `E2E_TOUR_EMAIL` / `E2E_TOUR_PASSWORD` (don't paste them in chat or commit them); or
- in `pnpm db:studio`, delete that user's `user_tour` rows and the `entry` rows of their tracker. Only on the Neon development branch (see "Before you start"); never against production.

Then, at 1280px:
- **On load:** "Adding your data" starts with the Settings button highlighted. The page can't be clicked, and Tab stays inside the card.
- **Opening the dialog:** Next through steps 1–4. Step 5 opens "Add flight" and highlights Category.
  - The card's buttons respond to clicks and to the keyboard.
  - The dialog's fields don't respond.
- **Back out of the dialog:** Back on step 5 closes the dialog and highlights "+ Add earning". Next opens it again.
- **Done:** Next to step 9, then Done. The tour closes, the dialog stays open, and focus is in the dialog.
- **Reload:** reload the page. The tour doesn't start again. `user_tour` has `adding-data | completed`.
- **Skip and Esc:** clear the row in `db:studio`, then reload.
  - Press Esc on step 6: the tour and the dialog both close.
  - Reload: no tour, and the row says `dismissed`.

Repeat at 375px: the card is docked at the bottom, and the cutout follows the target when the page scrolls.

- [ ] **Step 5: Commit**

```bash
pnpm format
git add src/app/dashboard/_components/help/tour.tsx src/app/dashboard/page.tsx
git commit -m "Add guided tour engine with first-visit auto-start"
```

### Task 10: Help menu and reading banner

**Files:**
- Create: `src/app/dashboard/_components/help/help-menu.tsx`
- Create: `src/app/dashboard/_components/help/reading-banner.tsx`
- Modify: `src/app/dashboard/_components/dashboard.tsx`

- [ ] **Step 1: Write `HelpMenu`**

```tsx
'use client';

import { useId } from 'react';
import { buttonClass } from '@/components/ui';
import { TOUR_KEYS } from '@/lib/tracker/types';
import { TOURS } from './help-content';
import { useTour } from './tour';
import { useAnchoredPopover } from './use-anchored-popover';

/** Header button listing the guided tours, so any of them can be replayed. */
export function HelpMenu() {
  const { start } = useTour();
  const menuId = useId();
  const { anchorRef, popoverRef } = useAnchoredPopover<HTMLButtonElement, HTMLDivElement>();

  return (
    <>
      <button ref={anchorRef} type="button" popoverTarget={menuId} className={buttonClass.secondary}>
        Help
      </button>
      <div ref={popoverRef} id={menuId} popover="auto" className="fixed inset-auto m-0 w-60 rounded-xl border border-line bg-surface p-2 text-foreground shadow-lg">
        <p className="px-2.5 pb-1 pt-1.5 text-[11px] font-bold uppercase tracking-[2px] text-muted">Guided tours</p>
        {TOUR_KEYS.map((key) => (
          <button
            key={key}
            type="button"
            className="block w-full rounded-md px-2.5 py-2 text-left text-sm hover:bg-[#edf3f0] focus-visible:bg-[#edf3f0] focus-visible:outline-none"
            onClick={() => {
              popoverRef.current?.hidePopover();
              start(key);
            }}
          >
            {TOURS[key].title}
          </button>
        ))}
      </div>
    </>
  );
}
```

- [ ] **Step 2: Write `ReadingBanner`**

```tsx
'use client';

import { buttonClass } from '@/components/ui';
import { useTracker } from '../tracker-context';
import { helpPrompt } from './help-prompt';
import { useTour } from './tour';

/** Offers "Reading the dashboard" once the account has enough data to explain. Hidden for good once dismissed. */
export function ReadingBanner() {
  const { data, markTour } = useTracker();
  const { start, active } = useTour();
  if (active || helpPrompt({ tours: data.tours, entries: data.entries }) !== 'offer-reading') return null;

  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-surface px-4 py-3 text-sm">
      <p>
        <strong>Your dashboard has data now.</strong> <span className="text-muted">Take a quick tour of how to read it.</span>
      </p>
      <div className="flex gap-2">
        <button type="button" className={buttonClass.secondary} onClick={() => markTour('reading-dashboard', 'dismissed')}>
          No thanks
        </button>
        <button type="button" className={buttonClass.dark} onClick={() => start('reading-dashboard')}>
          Show me
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Add both to the dashboard**

In `src/app/dashboard/_components/dashboard.tsx`:
- Import `HelpMenu` from `./help/help-menu` and `ReadingBanner` from `./help/reading-banner`.
- Put `<HelpMenu />` first in the header's button group, before Settings.
- Put `<ReadingBanner />` between `</header>` and the summary grid `<div className="grid gap-5 lg:grid-cols-[1.15fr_1fr]">`.

- [ ] **Step 4: Check types and lint**

Run: `pnpm typecheck && pnpm lint`
Expected: both pass.

- [ ] **Step 5: Check in the browser**

Use the `.env.local` E2E account. It needs 3 or more entries; add flights if it has fewer. In `db:studio`, delete its `reading-dashboard` row if one exists.
- **Banner:** it shows. "Show me" runs all 6 steps of "Reading the dashboard", and the banner is hidden while the tour runs. Done saves `completed`, and the banner stays gone after a reload.
- **No thanks:** delete the row again and reload. "No thanks" hides the banner at once. It stays hidden after a reload, and the row says `dismissed`.
- **Help menu:**
  - It opens under the Help button.
  - Each item closes the menu and starts its tour, including "Adding your data" on an account that has data.
  - Esc and outside clicks close the menu.
- **"Planning ahead":** it highlights the earning mix, then the flights panel, then the activity log.

- [ ] **Step 6: Commit**

```bash
pnpm format
git add src/app/dashboard/_components/help/help-menu.tsx src/app/dashboard/_components/help/reading-banner.tsx src/app/dashboard/_components/dashboard.tsx
git commit -m "Add Help menu and reading-tour banner"
```

### Task 11: Full verification and pull request

- [ ] **Step 1: Run every check**

Run: `pnpm test && pnpm typecheck && pnpm lint && pnpm build`
Expected: all pass. Vitest should list the existing suites plus `position.test.ts` (7) and `help-prompt.test.ts` (8).

- [ ] **Step 2: Do the spec's manual checklist**

Work through the "Manual" list in the spec's Testing section at 1280px and 375px. Also do a keyboard-only pass: tab to a "?" and open it with Enter, then start a tour from the Help menu and finish it using only the keyboard. Check `read_console_messages` for errors. Fix anything that fails before moving on, and note what you checked in the PR description.

- [ ] **Step 3: Copy review**

Tell Taylor that `help-content.ts` holds all the draft copy for Karl's review. Copy changes stay in that one file.

- [ ] **Step 4: Open the pull request**

Use superpowers:finishing-a-development-branch. Push `dashboard-help` and open a PR into `main`. Never merge locally. The PR description should cover:
- what was added;
- the new `user_tour` migration, which runs on deploy;
- the manual checks you did;
- that the copy is waiting for Karl's review.
