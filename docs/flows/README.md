# UI flows (current)

**Sources:** `src/main.tsx`, `src/app/App.tsx`, `src/app/composition.ts`.

Only the flow that exists in code is described as current. Version 1 seller flows from the PDR/SPEC are listed as **pending**.

## 1. Open the application

1. The browser loads `index.html` and `src/main.tsx`.
2. If `#root` is missing, startup throws `No se encontró el elemento #root`.
3. `createAppContainer()` reads `VITE_API_BASE_URL`.
4. `App` renders a top bar and opens `/sales-day`. That screen links to customers, the sale search, the load sheet, and invoices. There is no side menu.
5. `ES | EN` switches the chrome between Spanish and English and stores the choice in `localStorage`. The default is Spanish.
6. No print dialog runs. Login, logout, the current Sales Day, opening it, and product search call the API. The four lists read sample adapters.

## 2. Search products

Screen: `/sales`.

1. An empty query does not call the API. The screen asks for a name, brand, or code.
2. Submit calls `SearchProductsUseCase`, which trims the query and calls `GET /products/search?q=`.
3. The mapper keeps `id`, `name`, `alegraId` as `code`, and `wholesalePrice`. The API payload has no brand name, so the hit does not invent one.
4. Wholesale price is display-only. There is no price input and no add-to-sale action.
5. A non-2xx response shows `error` from the body, or `HTTP {status}`. Network failure shows the client message. The list is cleared.

## Pending definition / not implemented

These are Version 1. They have **no** screens or use cases in this repository. Behavior belongs in the [SPEC](../specs/SPEC.md). HTTP details belong in the Core API flows.

| Flow | UI responsibility once built |
|---|---|
| Language | Shell control for Spanish (default) and English. Dictionaries live per screen. No API call. |
| Sign in / sign out | Built. The session token is sent as a bearer token and dies when the API process restarts. |
| Close and reopen Sales Day | Commands and confirmation. Open and read are built. Close and reopen are not. |
| Search or create customer | From the open Sales Day, including create during the visit. |
| Search catalog and edit a draft sale | Server search. Quantity and item name only. No price input. |
| Confirm sale | Show the invoice number returned by the API. |
| Void sale | While the Sales Day is open. Keep the number on screen as returned. |
| Load Sheet | Read-only, closed day only, no print. |
| List invoices and print | Load API documents and open one browser print dialog, with a page break between invoices. Reprint loads the documents again. |

The UI does not sync products to Alegra and does not import the Excel catalog.
