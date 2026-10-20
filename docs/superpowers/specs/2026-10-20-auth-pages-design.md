# Sign-in and sign-up restyle: Stratus Status

Brings the `(auth)` pages into the front page's look (see `2026-10-20-front-page-design.md`). Approved direction: **A, "Full sky"**, chosen over a split panel and a light header bar.

## Layout (`src/app/(auth)/layout.tsx`)

- The page fills the screen with `--sky`. A `--sky-deep` header holds the light `Logo` (links home), then fades into the sky like the hero.
- The hero's cloud bank (`sky-clouds.webp`) sits along the bottom, wider than the screen (`max(142vw, 1100px)`) so it stays deep on phones. Its top 40% is masked out so the artwork's sky blends into `--sky` without a seam.
- The card is centered above the clouds. `RedirectIfSignedIn` is unchanged.

## Card (`src/components/auth-form.tsx`)

- White, `rounded-3xl`, soft navy shadow, max 400px wide; 16px gutters at 375px.
- Headings: "Welcome back" / "Sign in to see where your status stands." for sign-in; "Create your account" / "Free to use. No airline login required." for sign-up.
- Inputs have a `--muted` border at 75% (3:1 against white) and a `--sky-deep` focus ring. Submit is a full-width `--navy` pill. The switch link is `--sky-ink`; errors stay `--accent`.
- Fields, names, `autoComplete`, `minLength` and the submit logic are unchanged.

## Shared pieces

`Logo` moves to `src/components/logo.tsx`; `logo.webp` and `sky-clouds.webp` move to `src/assets/`. The front page imports them from there.

## Contrast (WCAG AA, measured)

| Pair                                         | Ratio          |
| -------------------------------------------- | -------------- |
| White logo text on `--sky-deep`              | 5.0:1          |
| Heading, labels, button text                 | 14.5:1 or more |
| Subline and "New here?" (`--muted` on white) | 4.8:1          |
| Switch link (`--sky-ink` on white)           | 5.7:1          |
| Error (`--accent` on white)                  | 6.8:1          |
| Input border                                 | 3.3:1          |
