# UI flows (current)

**Sources:** `src/main.tsx`, `src/app/App.tsx`, `src/app/composition.ts`.

Only the flow that exists in code is described as current. Version 1 seller flows from the PDR/SPEC are listed as **pending**.

## 1. Open the application

1. The browser loads `index.html` and `src/main.tsx`.
2. If `#root` is missing, startup throws `No se encontró el elemento #root`.
3. `createAppContainer()` reads `VITE_API_BASE_URL`.
4. `App` renders the shell. `/` redirects to `/sales-day`. The other routes are placeholders.
5. Below `64rem` the navigation stacks. At `64rem` and wider it sits beside the page. The switch is a CSS media query.
6. No API request or print dialog runs.

## Pending definition / not implemented

These are Version 1. They have **no** screens or use cases in this repository. Behavior belongs in the [SPEC](../specs/SPEC.md). HTTP details belong in the Core API flows.

| Flow | UI responsibility once built |
|---|---|
| Sign in / sign out | Session of a seller, up to the API session limit. Blocked while the API has no authentication. |
| Open, read, close, reopen Sales Day | Commands and confirmation. The API decides the transition. |
| Search or create customer | From the open Sales Day, including create during the visit. |
| Search catalog and edit a draft sale | Server search. Quantity and item name only. No price input. |
| Confirm sale | Show the invoice number returned by the API. |
| Void sale | While the Sales Day is open. Keep the number on screen as returned. |
| Load Sheet | Read-only, closed day only, no print. |
| List invoices and print | Load API documents and open one browser print dialog, with a page break between invoices. Reprint loads the documents again. |

The UI does not sync products to Alegra and does not import the Excel catalog.
