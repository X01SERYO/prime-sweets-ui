# UI flows (current)

**Sources:** `src/main.tsx`, `src/app/App.tsx`, `src/app/composition.ts`.

Only the flow that exists in code is described as current. Version 1 seller flows from the PDR/SPEC are listed as **pending**.

## 1. Open the application

1. The browser loads `index.html` and `src/main.tsx`.
2. If `#root` is missing, startup throws `No se encontró el elemento #root`.
3. `createAppContainer()` reads `VITE_API_BASE_URL`.
4. `App` renders a top bar and opens `/sales-day`. That screen links to customers, the sale search, the load sheet, and invoices. There is no side menu.
5. `ES | EN` switches the chrome between Spanish and English and stores the choice in `localStorage`. The default is Spanish.
6. Login, logout, the current Sales Day, opening it, product search, customer search/create, day sales, the load sheet, and invoices call the API. Printing invoices opens one browser print dialog.

## 2. Search products

Screen: `/sales`.

1. An empty query does not call the API. The screen asks for a name, brand, or code.
2. Submit calls `SearchProductsUseCase`, which trims the query and calls `GET /products/search?q=`.
3. The mapper keeps `id`, `name`, `alegraId` as `code`, and `wholesalePrice`. The API payload has no brand name, so the hit does not invent one.
4. Wholesale price is display-only. There is no price input and no add-to-sale action.
5. A non-2xx response shows `error` from the body, or `HTTP {status}`. Network failure shows the client message. The list is cleared.

## 3. Search or create a customer

Screen: `/customers`.

1. An empty query does not call the API. The screen asks for a name or a document number.
2. Submit calls `SearchCustomersUseCase`, which trims the query and calls `GET /customers/search?q=`.
3. Each hit shows name, document type, and document number. Choosing one opens `/sales?customerId=`.
4. Create requires document type, document number, and name. Phone, email, and address stay behind a control that starts off. Empty required fields do not call the API.
5. Create calls `POST /customers`. `CUSTOMER_ALREADY_EXISTS` stays on the form. A created customer opens `/sales?customerId=` with the id from the response.
6. The sale screen loads that id with `GET /customers/:id` and shows the name. It does not create sale lines.

## Pending definition / not implemented

These are Version 1. They have **no** screens or use cases in this repository. Behavior belongs in the [SPEC](../specs/SPEC.md). HTTP details belong in the Core API flows.

| Flow | UI responsibility once built |
|---|---|
| Language | Shell control for Spanish (default) and English. Dictionaries live per screen. No API call. |
| Sign in / sign out | Built. The session token is sent as a bearer token. The API stores the session and keeps at most three open sessions for the seller. |
| Close and reopen Sales Day | Built. With no day, the screen only offers open. While the day is open, the seller starts sales and can close it after confirmation. Load sheet and invoices appear only after the day is closed. The API rejects a historical reopen. |
| Search or create customer | Built. Search calls `GET /customers/search?q=`. Create sends document type, number, and name; extra fields stay behind a control. Choosing or creating a customer opens `/sales?customerId=`. |
| List day sales | Built. The screen reads the current Sales Day and calls `GET /sales?salesDayId=`. Each row shows the customer name from `GET /customers/:id`, the status, the quantity, and the total. A draft opens `/sales?customerId=`. |
| Search catalog and edit a draft sale | Built when `/sales` has `customerId` and today’s Sales Day is open. The UI creates or reuses a draft, then adds a line, changes quantity and item name, and removes a line. Price is display-only. Confirm and void are not built. |
| Confirm sale | Built. `POST /sales/:id/confirm` runs only when the draft has at least one line. The screen shows `invoiceNumber` from the response. |
| Void sale | Built for the confirmed sale on screen. `POST /sales/:id/void` runs only while that Sales Day is open. The screen keeps `invoiceNumber` from the response. |
| Load Sheet | Built. `GET /load-sheets/:salesDayId` runs for a closed day. The screen does not group rows and has no print action. An open day is rejected. |
| List invoices and print | Built. `GET /invoices?salesDayId=` lists confirmed and voided sales. Voided sales stay on the list and cannot be printed. Preview and print call `GET /invoices/:saleId` again. One browser dialog prints the selected documents in invoice-number order, with a page break between them. |

The UI does not sync products to Alegra and does not import the Excel catalog.
