# UI flows (current)

**Sources:** `src/main.tsx`, `src/app/App.tsx`, `src/app/composition.ts`.

Only the flow that exists in code is described as current. Gaps that are still outside this repository are listed at the end.

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
4. Each hit shows the name and the wholesale price. The product code is not shown. The price is display-only. The hint "name, brand, or code" sits on an information icon beside the search label.
5. Choosing a hit opens the pending line for that product when today's Sales Day is open and the customer is loaded. A non-2xx response shows `error` from the body, or `HTTP {status}`. Network failure shows the client message. The list is cleared.

## 3. Search or create a customer

Screen: `/customers`.

1. An empty query does not call the API. The screen asks for a name or a document number.
2. Submit calls `SearchCustomersUseCase`, which trims the query and calls `GET /customers/search?q=`.
3. Each hit shows name, document type, and document number. Choosing one opens `/sales?customerId=`.
4. Create requires document type, document number, and name. Phone, email, and address stay behind a control that starts off. Empty required fields do not call the API.
5. Create calls `POST /customers`. `CUSTOMER_ALREADY_EXISTS` stays on the form. A created customer opens `/sales?customerId=` with the id from the response.
6. The sale screen loads that id with `GET /customers/:id` and shows the name, document type, and document number.

## 4. Sales Day, day sales, and the sale

1. `/login` stores the session in `sessionStorage` and sends it as a bearer token. Logout clears it.
2. `/sales-day` loads the current day. With no day, the only action is open. An open day can be closed after confirmation. A closed current day can be reopened after confirmation. Load sheet and invoices are linked only when the day is closed. Confirmations stay in their card, on one row.
3. `/day-sales` lists the day's sales newest first. Each row is one line: customer, status, `Factura {number}` when a number exists, amount, and the edit or void icon while the day is open.
4. `/sales?customerId=` creates or reuses the draft while the day is open. With no confirmed lines the table still shows its headers and one centered row, "Vacío".
5. A pending line has the product name and a quantity control on one row. Quantity starts at 1, steps by 1, and accepts up to 3 decimal places. The screen shows the unit price and the line total before the seller confirms the line.
6. Confirm sale calls `POST /sales/:id/confirm` only when the draft has at least one line. Void calls `POST /sales/:id/void` only while the day is open. The invoice number stays on the screen.

## 5. Load Sheet and invoices

1. `/load-sheets/:salesDayId` calls `GET /load-sheets/:salesDayId` for a closed day. The screen is one table. Beside the title it shows the sold total and the profit total. There is no print action.
2. `/invoices/:salesDayId` lists confirmed and voided invoices newest first. Each row is one line: selection, number, status, amount, whether it can be printed, and an eye icon for preview. Voided rows cannot be selected for print.
3. Preview calls `GET /invoices/:saleId`. Print loads each selected document and opens one browser dialog. Inside that dialog the documents follow ascending invoice number, with a page break between them. Reprint requests the same documents again.

## Still outside this UI

| Area | Where it lives |
|---|---|
| Catalog Excel import | Not in this client. |
| Alegra product sync | API only, on product update. |
| Choosing a printer or a printer protocol | Windows print dialog. The UI does not record that an invoice was printed. |
