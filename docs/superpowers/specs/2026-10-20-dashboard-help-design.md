# Dashboard help: tips and guided tours

## Goal
Help users understand the dashboard in three ways: how to enter their data, how to read the dashboard, and what the numbers mean. Karl asked for a first-time tutorial with popup callouts (`docs/feedback-round-1.md`, item 7). This project covers the tips and tours from that item. The setup wizard is a separate project.

## Decisions
- **Three layers:** "?" tips next to labels and numbers; three short task-based tours; one content file that both read from.
- **Built in-house, no tour library.** The Add earning and Settings dialogs are native modal `<dialog>`s (`src/components/modal-dialog.tsx`), which the browser draws in the top layer. While a modal dialog is open, the browser makes everything outside it inert, including popovers and overlays drawn above it. An overlay library like driver.js can't sit above the dialog or take input there. So the tour is itself a modal `<dialog>`, opened on top of the entry dialog when a step needs it. The topmost modal dialog is the one that takes input. This was tested in Chrome during spec review.
- **Tips open and close on click only.** Hover doesn't exist on touch screens, and mixing hover and focus with a click toggle makes the tip close on the click that was meant to open it. Tips replace the native `title` tooltips listed under Tip coverage. Other `title`s stay.
- **"Adding your data" runs on a new user's first visit.** A new account starts empty (`getOrCreateTracker` creates a tracker with no entries), so a tour about reading the chart would have nothing to show. The tour only starts automatically when the account has no non-cancelled entries. Existing users with data don't get it automatically. They see the "Reading the dashboard" banner instead, and every tour is in the Help menu.
- **"Reading the dashboard" is offered once there are 3 or more entries.** A banner suggests it.
- **Show-me tours, not hands-on.** The tour opens the Add earning dialog itself and steps through it with Next. The page doesn't take clicks or keyboard focus while a tour runs. The last step ends the tour and leaves the dialog open so the user can add a real flight.
- **Tour progress is stored per user, not per tracker.** A tracker is per status year, so storing progress on it would replay the tours each new year. Progress gets its own table so Better Auth's `user` table stays untouched.
- **Out of scope:** the setup wizard, hands-on tours, tour analytics events, and help outside the dashboard (marketing and auth pages).

## Units
All new client code lives in `src/app/dashboard/_components/help/`.

| File | Responsibility | Interface |
|---|---|---|
| `help-content.ts` | All help copy, plus the tour definitions. No React. | `TIPS: Record<TipId, { title: string; body: string }>`, `TOURS: Record<TourKey, Tour>` with `Tour = { title: string; steps: TourStep[] }`, `TourStep = { target: string; title: string; body: string; before?: 'openEntry' }`. `TipId` is a string-literal union derived from `TIPS`. |
| `position.ts` | Pure placement math, shared by tips and the tour card. | `place(target: Rect, popup: Size, viewport: Size, gap = 8): { top: number; left: number; side: 'top' \| 'bottom' }`. Prefers below the target. Flips above when the popup doesn't fit below and there's more room above. Clamps both axes inside the viewport with an 8px margin. |
| `help-prompt.ts` | Pure decision for what to show when the dashboard loads. | `helpPrompt({ tours, entries }): 'start-adding-data' \| 'offer-reading' \| null`. It counts `entries` whose state isn't `Cancelled`. Returns `start-adding-data` when `adding-data` has no status and the count is 0. Otherwise returns `offer-reading` when `reading-dashboard` has no status and the count is 3 or more. Otherwise `null`. |
| `info-tip.tsx` | The "?" button and its popover. | `<InfoTip id={tipId} />`. Renders inline, so it can sit inside a panel heading or next to a number. Both the button and the popover are phrasing content (the popover is a `<span>`), because tips sit inside `<p>` and `<h2>` elements. In dialogs it goes next to the `<label>`, never inside it. |
| `tour.tsx` | Tour state, the auto-start, the tour dialog, and its card. | `TourProvider` goes in `page.tsx`, inside `TrackerProvider` and around `<Dashboard>`. It exposes `useTour(): { start(key: TourKey): void; active: TourKey \| null }`, renders the tour dialog while a tour runs, and on mount calls `helpPrompt` with the tracker context's data and starts `adding-data` when told to. |
| `help-menu.tsx` | Header "Help" button with a menu of the three tours. | `<HelpMenu />`: a button that toggles a `popover="auto"` list of three buttons, one per tour. Picking one closes the menu and calls `start(key)`. |
| `reading-banner.tsx` | The dismissable "See how to read your dashboard" banner. | `<ReadingBanner />`. Shown when `helpPrompt` returns `offer-reading`. Its buttons are "Show me" (starts `reading-dashboard`) and "No thanks" (saves `dismissed`). |

Anchors: elements a tour step targets get a `data-help="<id>"` attribute. Examples: `data-help="add-earning"` on the "+ Add earning" button, `data-help="entry.method"` on the method field's wrapper `<div>`. `TourStep.target` is one of these ids. Tips don't need anchors, because `<InfoTip>` is placed where it should appear.

## Tips
- **Popover:** a `<button>` with `popovertarget` pointing at a `popover="auto"` element. The browser handles opening and closing on click, outside clicks and Esc. It also closes any other open tip and reports the expanded state. The button has `aria-label="About <title>"`.
- **Position:** set with `place()` from the button's rect, on open and again on `resize` and on `scroll`. The scroll listener is attached in the capture phase on `document`, so scrolling inside a dialog also triggers it.
- **Inside dialogs:** the tip is rendered inside the dialog's content, so the browser doesn't make it inert.

## Tour dialog
- **Element:** the tour is a `<dialog>` opened with `showModal()`. It is transparent and fills the viewport; its `::backdrop` is transparent too. While it's open the rest of the page, and any entry dialog under it, is inert, so neither clicks nor Tab reach the page.
- **Dim with a cutout:** inside the tour dialog, a box drawn around the target's rect (padding 6px, radius 12px) with a large `box-shadow` that dims everything else.
- **Card:** labelled by its title. It shows the step text, "n of N", and Back / Next / Skip. The last step shows Done instead of Next. Focus moves to the card's primary button on every step. Below 640px wide the card is fixed to the bottom of the screen. Otherwise it is placed with `place()` next to the cutout.
- **Finding the target:** the tour looks for `[data-help="<target>"]`. If it doesn't exist, the step is passed over in the direction of travel. "n of N" always counts the tour's defined steps. If Next finds no later step with a target, the tour ends as Done. If no earlier step has a target, Back is disabled. It scrolls the target into view with `block: 'center'` before measuring: instant when `prefers-reduced-motion: reduce`, smooth otherwise. It measures again on `resize` and on `scroll` (capture phase on `document`).
- **Steps that open the entry dialog (`before: 'openEntry'`):**
  1. Call `openEntry(undefined, { category: 'Flights' })` from the tracker context.
  2. `ModalDialog` calls `showModal()` in an effect and mounts its children only while open, so the context flag can be true before the dialog is modal. The tour checks the DOM once per animation frame until the step's target exists and `target.closest('dialog')?.matches(':modal')` is true, for at most 1 second. Back and Next are ignored while it waits.
  3. Close the tour dialog and `showModal()` it again, so it becomes the topmost modal above the entry dialog.
  4. If the target isn't ready within 1 second, the tour closes the entry dialog it opened and ends without saving a status. It's offered again on the next visit.
- **Back out of the entry dialog:** moving to a step before the first `openEntry` step closes the entry dialog if the tour opened it. Steps after it (6–9 in "Adding your data") keep it open.
- **Ending:**
  - **Done** closes the tour dialog and saves `completed`. If the entry dialog is open it stays open and becomes usable, and focus returns to its field.
  - **Skip** saves `dismissed`, and so does Esc, which the browser sends to the topmost dialog as a `cancel` event. If the tour opened the entry dialog, Skip and Esc both close it.
  - The tour ends only from the card's buttons and the `cancel` event, never from the dialog's `close` event, because the close-and-reshow in step 3 fires `close` too. The `cancel` handler doesn't rely on `preventDefault()`: the browser closes the tour dialog on Esc, and the React state follows.
- **Reload mid-tour:** reloading during the auto-started `adding-data` tour starts it again, because no status has been saved yet. That's expected. Tours started from the menu or banner don't restart.
- **StrictMode:** the auto-start runs from a mount effect, so a ref makes sure it fires once per page load.

## Tours
Keys are `adding-data`, `reading-dashboard` and `planning-ahead`. Draft copy is written into `help-content.ts` during implementation, and Karl reviews it before the branch merges.

1. **Adding your data** (`adding-data`): starts on a new user's first visit (see Decisions).
   1. Settings button: tell us which Delta cards you hold or are considering.
   2. Card MQD Headstarts panel.
   3. Monthly credit-card earnings panel.
   4. "+ Add earning" button.
   5. Category field (`before: 'openEntry'`; the dialog opens with Flights selected).
   6. Method field.
   7. Route field (`f-route` wrapper): IATA codes, round trip.
   8. Fare field (`f-amount` wrapper): the eligible fare, which excludes taxes and fees. Its label follows the chosen method.
   9. State field: what Potential, Projected, Pending and Posted mean, and how they relate to the Booked and Credited switches on flight cards. The step body ends with "Now add your first flight." Done leaves the dialog open.
2. **Reading the dashboard** (`reading-dashboard`): started from the banner or the Help menu.
   1. Summary card: goal and progress.
   2. Gap and monthly pace.
   3. Progress bar and its tier markers (`StatusBar` in `summary-card.tsx`).
   4. Tier tiles (the Silver / Gold / Platinum / Diamond grid in `summary-card.tsx`).
   5. Projected totals chart: the posted, forecast and even-pace lines.
   6. "Where earnings come from" breakdown.
3. **Planning ahead** (`planning-ahead`): Help menu only.
   1. "Find your earning mix" panel and slider.
   2. Potential vs Posted: potential entries feed the forecast but not the posted total. Target: the flights panel.
   3. Earning activity log and its state filter.

## Tip coverage (first pass)
Each tip is a short title plus one to three sentences.
- **Summary card:** goal, gap, monthly pace, posted vs forecast.
- **Chart and breakdown:** tier tiles, chart lines (`progress-chart.tsx`), breakdown (`insights.tsx`).
- **Planning and data sections:** earning mix, flight states (`flights-section.tsx`), Headstarts, monthly spend, travel bonuses, ledger states.
- **Add earning dialog:** method, eligible fare, override.
- **Settings dialog:** as-of date, card holdings.

The "Exact credit" `title` on the monthly-spend override input (`monthly-spend-section.tsx`) is replaced by the monthly spend tip. Native `title` attributes that only repeat visible text stay as they are. That covers the tier markers, the month names and the bar segment values. The ledger's "Calculated estimate" `title` on the "≈" mark (`ledger.tsx`) also stays, and the ledger-states tip mentions what "≈" means.

## Data
- **New table** in `src/lib/db/schema.ts`, with a migration from `pnpm db:generate`:
  ```
  user_tour
    user_id     text, FK user.id, on delete cascade
    tour_key    text, enum TOUR_KEYS
    status      text, enum TOUR_STATUSES
    updated_at  timestamp, default now
    primary key (user_id, tour_key)
  ```
- **Shared constants:** `TOUR_KEYS = ['adding-data', 'reading-dashboard', 'planning-ahead']` and `TOUR_STATUSES = ['completed', 'dismissed']` go in `src/lib/tracker/types.ts`, along with their `TourKey` and `TourStatus` types. `schema.ts` imports them with a relative path (`'../tracker/types'`), like its other imports, because drizzle-kit loads it.
- **Load:** `getDashboardData` also selects the user's `user_tour` rows. `DashboardData` gets a new field, `tours: Partial<Record<TourKey, TourStatus>>`.
- **Save:** server action `markTour(key, status)` in `src/app/dashboard/actions.ts`. It calls `requireUser`, validates both arguments with Zod, upserts the row, and calls `refresh()` like the other actions.
  - The tracker context gets a new `Op`, `{ type: 'tour'; key: TourKey; status: TourStatus }`, and a matching `reducer` case. The client calls `run({ type: 'tour', key, status }, () => actions.markTour(key, status))`. The banner then hides at once, and `refresh()` keeps it hidden after the action finishes.
  - Replaying a tour from the Help menu overwrites the row when it ends.
  - Going through `run` sets `pending` for the moment the action runs, which briefly disables the monthly-spend inputs, as any other save does. That's acceptable.
- **Which entries count:** `helpPrompt` receives `data.entries`, not `activeEntries`. Every entry the user created counts, including Headstarts and monthly spend. Those also give the chart something to show.

## Integration
- **`page.tsx`:** `TourProvider` wraps `<Dashboard>`, inside `TrackerProvider`.
- **`dashboard.tsx`:**
  - `<HelpMenu />` goes in the header, next to Settings.
  - `<ReadingBanner />` goes above the summary grid.
- **Panel headings** get `<InfoTip>` inside the `title` node passed to `PanelHead`. `PanelHead` itself doesn't change.
- **Tour targets:** `data-help` attributes go on the elements each tour step names.
- **Settings:** the "Show tour again" link planned in `docs/feedback-round-1.md` is replaced by the Help menu.

## Testing
- **Vitest:**
  - `help-prompt.ts`, cases:
    - no statuses with 0 entries, 2 entries, 3 entries, and only Cancelled entries;
    - `adding-data` saved, with 2 and 3 entries;
    - both tours saved;
    - existing user with no statuses and 5 entries (expects `offer-reading`).
  - `position.ts`, cases:
    - placed below by default;
    - flips above;
    - stays below when neither side fits and below has more room;
    - clamped horizontally at both edges;
    - clamped vertically.
- **Manual, in the browser pane at desktop and 375px:**
  - **Fresh account:**
    - "Adding your data" starts.
    - On the dialog steps the card's buttons can be clicked and reached by keyboard, and the entry dialog behind can't be.
    - Back from the Category step closes the entry dialog and highlights "+ Add earning".
    - Done leaves the entry dialog open and usable.
    - A reload doesn't start the tour again.
  - **Skip and Esc:**
    - Both end the tour.
    - On a dialog step, both also close the entry dialog.
    - A reload doesn't start the tour again.
  - **During a dashboard step:** Tab never reaches the page behind the tour.
  - **Existing account with data:** no automatic tour, and the banner shows.
  - **Banner:** "No thanks" hides it, and it stays hidden after a reload.
  - **Help menu:** each item starts its tour.
  - **Tips:**
    - Open and close on tap and click, and close on Esc and outside clicks.
    - Stay on screen near the edges.
    - Follow the page when the entry dialog scrolls.
  - **Keyboard only:** tab to a "?" button and open it, then run a full tour.
