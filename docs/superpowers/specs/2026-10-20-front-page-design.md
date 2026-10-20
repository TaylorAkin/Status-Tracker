# Front page redesign: Stratus Status

## Goal
Replace the single-screen landing page (`src/app/page.tsx`) with a full front page that explains the product and uses the new Stratus Status artwork. The site's user-facing name changes from "StatusTrack" to **Stratus Status**, matching the domain (stratusstatus.com) and the icon.

Approved mockup: `docs/design/front-page-mockup/index.html` (open it in a browser). The yellow tags in the mockup mark sections and are not part of the design. Where this spec and the mockup differ, the spec wins. The differences are the deeper blue behind the text and the solid secondary button (both for contrast), and the corrected sample data.

## Decisions
- **Name:** Stratus Status everywhere a user sees the product name. Repo, package name and code identifiers stay `statustrack`.
- **Direction:** sky hero + sections (chosen over a split hero and the minimal one-screen option).
- **Static page:** the front page has no data fetching and no session check, so it prerenders as static HTML under Cache Components. The header always shows "Sign in" and "Get started"; the existing `(auth)` layout already sends signed-in users on to `/dashboard`.

## Page structure (top to bottom)

| # | Section | Content |
|---|---|---|
| 1 | Header (inside the hero) | Logo (icon + "Stratus Status") on the left. On the right: "Features" and "How it works" anchor links (hidden below 640px), "Sign in" link, "Get started" pill (→ `/sign-up`). |
| 2 | Hero | Eyebrow chip "For Delta SkyMiles Medallion members". H1 "Know exactly where your status stands." Subhead (today's copy, with "Headstarts" capitalized). CTAs: "Get started for free" (→ `/sign-up`), "Sign in" (→ `/sign-in`). Below the copy, the sky artwork (plane + gauge + clouds) fills the width, its top edge faded into the hero background so the join is invisible. |
| 3 | Product preview | Sits over the bottom of the clouds (negative top margin). Left: a summary card that looks like the dashboard's `SummaryCard`. Right: a "Your flights" card (3 rows with Credited / Booked / Planned chips) and a "Posted vs forecast" mini chart. A visible caption: "Example dashboard with sample data". |
| 4 | Features (`id="features"`) | Kicker "Every MQD, in one place", H2 "All the ways you earn, added up for you.", lede, then four cards: Flights, Card spend, Headstarts & bonuses, Forecast & pace, each with a line icon and a one-sentence description (copy as in the mockup). |
| 5 | How it works (`id="how"`) | Kicker "Set up in minutes", H2 "Three steps to a clear answer.", three numbered steps joined by a dashed line: Pick your goal tier → Add flights and cards → Watch the gap close. |
| 6 | Closing CTA | Sky background, H2 "Plan your next Medallion year with confidence.", line "Free to use. No airline login required.", "Get started for free" button, cloud band artwork along the bottom. |
| 7 | Footer | Logo, and the disclaimer: "Estimates only. Not affiliated with Delta Air Lines or American Express. Delta's posted MQDs are the source of truth." No Terms/Privacy/Contact links until those pages exist. |

Copy marked new (eyebrow, feature descriptions, step text, closing line) goes to Karl for review before the branch merges, like the dashboard footer did.

### Sample data in the preview
The numbers are hard-coded. They describe one moment, **status year 2027, as of March 1, 2027**, and agree with each other, with the dashboard's tier scale (Silver 5,000 / Gold 10,000 / Platinum 15,000 / Diamond 28,000) and with the engine's `monthsLeft` (which counts the current month, so March 1 leaves 10 months):

- Card header: "Delta SkyMiles · 2027", "Medallion Status", badge "Gold Medallion goal".
- Goal Gold, target 10,000. Posted 7,840 (78% of goal), mostly from two card Headstarts in January. Pending 720. Projected 2,950. Total forecast 11,510.
- Bar scale is 0–28,000: posted fill 28%, forecast fill 41%, tier ticks at 17.9% / 35.7% / 53.6% / 100%.
- Gap callout: "2,160 MQDs to Gold from posted — already covered by your forecast. 216 MQDs / month across 10 remaining months."
- Flights card, titled "Your flights", oldest first: ATL → JFK · Jan 28 (Credited), ATL → LAX · Mar 14 (Booked), LAX → SEA → ATL · Apr 2 (Planned).
- Mini chart (illustrative, inline SVG, viewBox 300×120, x = Jan 1 → Dec 31, y = 0 → 12,000 MQDs, so y-pixel = 110 − MQD ÷ 120):
  - Even-pace line, grey dashed: (0,110) → (300,26.7).
  - Gold goal line, thin horizontal at y = 26.7, labeled "Gold".
  - Posted, solid `--brand`: (0,110) → (5,68.3) [5,000 Headstarts] → (25,62) → (50,44.7) [7,840 on Mar 1], with a dot at the last point.
  - Forecast, dashed light blue, from the posted dot to (300,14.1) [11,510].
  - Legend line: "Solid = posted · dashed = forecast · grey = even pace".

The preview is a picture of the product, not a working widget. `SummaryCard` is a client component bound to `useTracker`, so the preview is static markup that copies its classes; it does not import dashboard components. It is wrapped in a `<figure>` whose visible `<figcaption>` reads "Example dashboard with sample data".

## Visual system
- **Font:** Geist (already loaded in the root layout).
- **New color tokens** in `src/app/globals.css`, next to the existing palette, exposed through `@theme inline`:
  - `--sky: #2f9ff9`: the artwork's sky color, used where the background meets the artwork
  - `--sky-deep: #1570c8`: the background behind all text on blue
  - `--sky-ink: #1667b8`: section kickers on the light page background
  - `--navy: #1b2547`: primary buttons; matches the gauge in the icon
- **Hero background:** solid `--sky-deep` behind the header and all of the hero copy, down to the bottom of the CTA row. From there a gradient runs to `--sky` over the space above the artwork (about 120px on desktop). The artwork's top edge fades out with a mask (Tailwind 4 `mask-t-from-*`), so the blue deepens toward the top of the screen, like altitude, with no visible seam.
- **Closing CTA background:** the same pattern. Text sits on `--sky-deep`, and a gradient to `--sky` runs down into the cloud band.
- **Below the hero:** existing `--background`, `--surface`, `--line`, `--muted`, `--brand`, `--accent` tokens. Preview cards copy the dashboard summary card's look (navy gradient header, red top rule).

### Contrast rules (WCAG AA)
All text on blue sits on `--sky-deep`; no text sits on `--sky`.

| Text | On | Ratio | Rule |
|---|---|---|---|
| White: header links, logo, eyebrow, H1, subhead, closing H2 and line | `--sky-deep` | 5.02 | Passes for normal text |
| Primary CTA: white on `--navy` | — | 14+ | Passes |
| Secondary CTA ("Sign in") | — | — | Solid white button with navy text, not the mockup's translucent ghost button |
| Eyebrow chip | `--sky-deep` | 5.02 | Border only (`white/40`), with no fill. Any fill above about 6% white drops the white text below 4.5:1 |
| Section kickers: `--sky-ink` | `--background` | 5.24 | Passes |

## Code structure
The page moves into a `(marketing)` route group, matching the plan's `app/(marketing)` layout. The URL stays `/`.

```
src/app/(marketing)/
  page.tsx                  # composes the sections; exports metadata
  _assets/
    logo.webp               # icon (1024², from the rounded Stratus Status icon)
    sky-hero.webp           # plane + gauge + clouds (1981×794)
    cloud-band.webp         # cropped cloud strip (1983×236)
  _components/
    logo.tsx                # icon + wordmark; `tone: 'light' | 'dark'` prop
    site-header.tsx
    hero.tsx                # renders <SiteHeader />, copy, CTAs, artwork
    product-preview.tsx     # sample summary card, flights card, mini chart
    features.tsx
    how-it-works.tsx
    closing-cta.tsx
    site-footer.tsx
```

- `src/app/page.tsx` is deleted (the route group's `page.tsx` replaces it).
- Every component is a Server Component with no props except `Logo`'s `tone`. Each one owns its own copy and markup; `page.tsx` only orders them.
- Images use `next/image` with static imports, which supply width, height and `blurDataURL`. The hero and cloud band also set `placeholder="blur"` explicitly; the logo doesn't. The hero artwork is the page's largest image, so it gets `loading="eager"`, `fetchPriority="high"` (Next 16 deprecated `priority`, and its docs recommend these over `preload`) and `sizes="100vw"`. All artwork is decorative: `alt=""`.
- Icons are inline SVG, with no new dependency.
- Links use `next/link`. In-page anchors are plain `<a href="#features">`.
- **Smooth scrolling:** `src/app/globals.css` sets `html { scroll-behavior: smooth }` inside `@media (prefers-reduced-motion: no-preference)`. The root `<html>` in `src/app/layout.tsx` gets `data-scroll-behavior="smooth"`, so Next 16 still jumps instantly on route changes. Without the attribute, Next 16 no longer overrides the CSS during navigation.

## Rename
- Root layout `metadata`: `title: { default: 'Stratus Status', template: '%s · Stratus Status' }`, `description: 'Track your Delta Medallion status: posted and projected MQDs from flights, card spend, and Headstarts.'`
- Page titles drop the hard-coded suffix: Dashboard → `'Dashboard'`, sign in → `'Sign in'`, sign up → `'Create account'`. The front page uses the default title.
- Any visible "StatusTrack" text in `src/` becomes "Stratus Status". Today that is only the landing eyebrow (removed by this redesign) and the metadata above. The `statustrack` names in the export route are a filename and a backup format id, so they stay.
- The dashboard's H1, "Delta Status Tracker", names the page rather than the product, so it stays.
- README: the title becomes `# Stratus Status`, and the first line becomes "Taylor and Karl's airline status tracker (stratusstatus.com): plan and track Delta SkyMiles Medallion Qualifying Dollars (MQDs) from flights, card spend, Headstarts, and bonuses."

## Responsive behavior
- **≥ 900px:** preview is two columns (summary card 1.15fr, side cards 0.85fr) and overlaps the clouds by about 230px. Features are four columns, steps three columns.
- **640–900px:** preview stacks to one column with a smaller overlap. Features are two columns.
- **< 640px:** 16px gutters. Header shows the logo, "Sign in" and "Get started" on one line (no wrapping). Features and steps are one column; the dashed step connector is hidden. Hero artwork keeps a minimum height of about 220px so the gauge stays visible.
- No horizontal scroll at any width down to 320px.

## Out of scope
Pricing page, Terms/Privacy pages and their footer links, an Open Graph image, dark mode, a signed-in variant of the header, analytics, and renaming the repo or package.

## Verification
- `pnpm typecheck`, `pnpm lint` and `pnpm build` pass; the build output lists `/` as static (prerendered).
- In the browser at 1440, 768 and 375px wide, the page matches the mockup, except where this spec differs: artwork joins the hero background with no visible seam, the preview overlaps the clouds, and there's no horizontal scroll.
- "Get started" and "Get started for free" go to `/sign-up`; "Sign in" goes to `/sign-in`; "Features" and "How it works" scroll to their sections.
- Browser tab titles read "Stratus Status", "Sign in · Stratus Status", "Create account · Stratus Status" and "Dashboard · Stratus Status".
- A contrast spot-check of the hero, kickers and closing CTA, using the browser's accessibility tools, meets the rules above.
- With reduced motion on, the anchor links jump instead of scrolling smoothly. Going from sign-in to the dashboard doesn't smooth-scroll.
- The hero image request starts early (high fetch priority) and the page has no layout shift when images load.

## Round 2: design 1a hero and animations (2026-10-20)

The hero now follows concept **1a, "Above the clouds"**, from the Claude Design project "StratusStatus landing page concepts". Everything below the hero is unchanged.

**Layout**
- The hero fills the screen under the header (`100svh` minus the header, clamped to 640–920px).
- The clouds are anchored to the bottom and are about 142% of the viewport wide, as in 1a.
- The headline is now "Know exactly where your airline status stands." The eyebrow chip is gone.
- The buttons are pills, pinned over the clouds with the short disclaimer under them. On phones they sit under the subhead.
- A "See it in action" link with a bouncing chevron sits at the bottom of the hero and jumps to the product preview, which no longer overlaps the clouds.

**Kept from round 1, on purpose**
- All text on blue sits on `--sky-deep` (5.02:1), which fades into the sky. 1a's white text on the light sky would be about 2.6:1.
- Geist stays the font. 1a uses Instrument Sans.
- The logo stays the icon with "Stratus Status". 1a uses a dot with "StratusStatus".
- The header links stay the same.
- The button label stays "Get started for free", from Karl's feedback.

**Artwork**
- The original artwork is split into two layers: `sky-clouds.webp`, with the gauge and plane painted out, and `plane.webp`, a transparent cut-out.
- The gauge is redrawn as an SVG arc at the original geometry: centre (990, 392), radius 208 and stroke 28, in artwork pixels.
- The gauge and plane sit in a stage that fills the space between the copy and the buttons, sized with container query units, so neither covers text at any size.

**Animations**
- On load, the gauge's navy arc fills from left to right to the sample's posted percent (78%). This is a CSS `stroke-dashoffset` animation that runs for 1.6s.
- Scrolling sets `--fly` from 0 to 1 over 60% of the hero's height. The gauge fades out, and the plane climbs, shrinks and fades. Scrolling back up reverses it.
- With reduced motion, the gauge shows filled, nothing moves on scroll, and the chevron doesn't bounce.
