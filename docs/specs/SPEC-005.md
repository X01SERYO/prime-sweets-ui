# SPEC-005 — Fluid PC layout

**Status:** Proposed
**Language:** English
**Architecture:** Presentation only, inside the shell and view stylesheets. [ADR-004](../adrs/ADR-004.md).
**Document role:** Implementation guide for [PDR-005](../pdrs/PDR-005.md). Not a description of the running client.

No domain model, use case, port, route, or i18n key changes. Do not copy this file into `architecture/`, `model/`, or `flows/` until the CSS is in the client.

## 0. Impact on what is already built

| Area | Built | Change |
|---|---|---|
| `.shell main` in `src/app/styles.css` | `min(64rem, 100%)`, then `min(76rem, 100%)` at `64rem` | One fluid width. Delete the `76rem` override. |
| Root type | Browser default; phone forces `body` to 14 px under `40rem` | Fluid root size only at `min-width: 64rem`. |
| Phone block `max-width: 40rem` | 14 px body, 16 px inputs, bottom nav | Unchanged. |
| Sidebar switch | `min-width: 64rem` | Unchanged breakpoint. Spacing may use the new root size. |
| Feature CSS (`productAdmin`, `retail`, `loadSheet`, `daySalesList`) | Fixed `rem` and some `max-width` on controls | Leave control caps. Let tables use the wider main. Adjust a view only if a column overflows after the shell change. |
| Print CSS | 70 mm invoice | Unchanged. |

## 1. Shell rules

In `src/app/styles.css`:

```css
.shell main {
  width: min(100%, 120rem);
  margin-inline: auto;
  padding-inline: clamp(1rem, 2vw, 2.5rem);
}

@media (min-width: 64rem) {
  html {
    font-size: clamp(16px, 0.35vw + 12px, 20px);
  }
}
```

Remove the block that sets `.shell main { width: min(76rem, 100%); }` at `min-width: 64rem`.

`0.35vw + 12px` is about 16.5 px at 1280 px and 18.7 px at 1920 px, capped at 20 px. Existing `rem` rules scale with it. Do not rewrite each component's `font-size` in this step.

## 2. Checks after the shell change

Open these routes at 1280×800 and at 1920×1080, signed in:

| Route | Look for |
|---|---|
| `/` | Week cards use the column; title is larger at 1920 than at 1280. |
| `/products` | Table grows; pager and row actions stay on one line or wrap without horizontal page scroll. |
| `/retail-sales` | Search, quantity, and the day table use the column. |
| `/load-sheets` | Sheet table uses the column. |
| `/login` | Form stays a readable card, not a full-bleed field. If `.login` has its own max width, keep it. |

Then narrow the window to 390 px: bottom navigation, 16 px inputs, and single column remain.

## 3. Out of scope for the first code change

Per-view redesign, a font-size control, and new breakpoints between 40 rem and 64 rem.
