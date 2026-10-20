# Karl's feedback round 1: plan

## Context
Karl reviewed the live site (status-tracker-plum.vercel.app) and left 8 notes in "Status Tracker Notes" (Google Doc, with screenshots of the landing page, the Settings dialog, and the Add flight dialog). This plan groups them by effort, proposes a fix for each, and orders the work. The original project plan lives in the repo at `statustrack/docs/plan.md`.

## The feedback and proposed solutions

### A. Quick wins (about half a day, one PR)

1. **Landing CTA: "Get started free" → "Get started for free".** Keep the "not affiliated" disclaimer (Karl likes it).
   - `src/app/page.tsx`

2. **NEED A WAY TO DELETE FLIGHTS (in the flight section).** Today delete only exists in the activity log at the bottom.
   - Add a **Delete** button to the edit dialog, bottom left, shown only when editing. It confirms, then runs the existing optimistic delete: `run({ type: 'delete', id }, () => actions.deleteEntry(id))` (same call as `ledger.tsx`). This also gives Headstarts, bonuses and spend a delete path.
   - Add a small **Delete** link next to **Edit** on each flight card (`flights-section.tsx` `FlightCard`), with the same confirm.
   - No server change: `deleteEntry` in `src/app/dashboard/actions.ts` already scopes deletes to the user's tracker.

3. **Consistent control heights (Goal tier vs Target MQDs boxes, and "dropdowns equal height to other inputs" everywhere).** Native `<select>` and `<input type="number">` render at different heights.
   - In `src/components/ui.tsx`: give `inputClass` a fixed height (`h-11`) and add a `selectClass` with the same height, `appearance-none`, and a custom chevron (the original tracker used an SVG chevron the same way).
   - Use it for every select: `settings-dialog.tsx` (Goal tier), `entry-dialog.tsx` (Category, State, Method), `flights-section.tsx` (Show flights), `ledger.tsx` (state filter), `insights.tsx` (card rate).
   - Align the Goal tier / Target MQDs row with `items-end` so the labels and boxes line up.

4. **Card buttons need faint dividers** (the "I have it / Considering / Don't have" control in Settings).
   - In `settings-dialog.tsx`, add `divide-x divide-line` to the segmented control, slightly more padding, and a clearer selected state.

5. **Bottom disclaimer: clearer and more accurate.** Rewrite the dashboard footer (`src/app/dashboard/_components/dashboard.tsx`) into three short lines:
   - **Estimates only.** MQDs shown are calculated from what you enter; Delta's posted MQDs are the source of truth.
   - **Rules can change.** Tier thresholds are Delta's published 2026 qualification levels, used as a planning assumption for {year}. Update your goal if Delta announces changes. Link to Delta's rules page.
   - **Not affiliated** with Delta Air Lines or American Express. Redeemable miles don't count toward status.
   - Karl reviews the wording before it ships.

### B. Medium: fare calculator for taxes and fees (about 1 day)

6. **"An easy way to calculate out the taxes and fees (which don't count toward MQDs)."** There isn't one flat formula worldwide, but US domestic fares are predictable. Two parts:
   - **Exact mode (always correct):** in the Add flight dialog, for the "Delta-marketed eligible paid fare" method, offer **"Ticket total" + "Taxes & fees"** fields (both printed on every Delta receipt). The eligible fare is total minus taxes. The existing "Eligible fare ($)" field stays for people who already know the base fare.
   - **Estimate mode (US domestic only):** an **"Estimate taxes"** button that backs government taxes out of the ticket total, using the airport route already in the dialog to count segments and airports:
     `base fare ≈ (total − segment fees − Sept 11 security fees − airport facility charges) ÷ (1 + federal excise tax rate)`
     with segment fees per segment, security fees per one-way leg, and facility charges per airport (capped per one-way). The dialog shows the breakdown and labels it an estimate.
   - **Where it lives:** the formula goes in the engine (`src/lib/engine/fares.ts`) with unit tests. The fee rates go in reference data keyed by year, because they change annually.
   - **Before building:** verify the current US rates (excise %, segment fee, security fee, facility-charge cap) from FAA/TSA sources. International itineraries get exact mode only, with a note explaining why.

### C. Larger: first-run experience (Phase 4, about 2 days)

7. **First-time / login tutorial with popup callouts.** This merges with Phase 4 onboarding:
   - **Setup wizard on first sign-in (3 steps):** pick a goal tier → pick the Delta cards you have or are considering → optionally add a first flight. This replaces landing on an empty dashboard and reuses the existing Settings logic (`updateSettings`, `setCardHoldings`).
   - **Guided tour after setup:** 4–5 callouts covering the summary card, the Booked/Credited toggles, monthly spend, the earning mix, and the activity log. Use **driver.js** (small, MIT licensed, accessible), or a small custom popover if we'd rather avoid a dependency.
   - **Remember completion** per user: add a `tourCompletedAt` column on `tracker` with a migration. Add a **"Show tour again"** link in Settings.

### D. Parked: waiting on Karl
8. **"Option to set 'as of' date for next year to prepare for 2027."** It's unclear whether he wants:
   - **(a)** a **year switcher** (track 2026 and 2027 separately; today the app is fixed to 2027), or
   - **(b)** a clearer **as-of date** control (e.g. a "start of next year" shortcut).
   - Taylor will ask him. If it's (a), it's about a day: add a year selector to the header, make `getOrCreateTracker` take a year (`src/lib/tracker/data.ts`), and seed tiers per year. If it's (b), it's under an hour.

## Order of work
1. **A (quick wins), one PR.** Ships today, after Karl approves the footer wording.
2. **B (fare calculator).** Starts with verifying the fee rates.
3. **C (setup wizard + tour)**, together with Phase 4.
4. **D** once Karl answers.

Each runs on its own branch with a Vercel preview deployment. Before branching, turn on Neon preview branching so previews don't share the production database.

## Verification
- **A:** in the browser on localhost:
  - delete a flight from its card and from the edit dialog; the summary and map update, and the deletion survives a reload
  - every select and input measures the same height (check with JS `getBoundingClientRect` on the dashboard and both dialogs)
  - the dividers look right at desktop and 375px widths
  - typecheck, lint and tests pass
- **B:** engine unit tests for the tax back-out using worked examples (1 segment, a connection, a round trip) against the verified rates. In the dialog, check that a known receipt's total and taxes give its posted base fare.
- **C:** a new account sees the wizard, lands on a populated dashboard, and the tour shows once. It never shows again after finishing or dismissing (verified after reload and sign-out/in). "Show tour again" works.
- **All:** check the Vercel preview deployment before merging to `main`.
