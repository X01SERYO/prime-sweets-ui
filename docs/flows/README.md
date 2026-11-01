# UI flows (current)

**Sources:** `src/main.tsx`, `src/app/App.tsx`, `src/app/composition.ts`, `src/modules/sales/adapters/ui/views/WeekHome.tsx`, `DaySalesList.tsx`.

## 1. Open the application

1. The browser loads `index.html` and `src/main.tsx`.
2. `createAppContainer()` reads `VITE_API_BASE_URL`.
3. A signed-in seller lands on `/`, the week home. There is no Sales Day screen. `/sales-day` and `/day-sales` redirect to `/`.
4. `ES | EN` switches the chrome and stores the choice in `localStorage`. The default is Spanish.
5. Login, logout, sales, the load sheet, and invoices call the API. Printing confirmed invoices opens one browser print dialog.

## 2. Week home

Screen: `/?deliveryDate=`.

1. With no date, the selected day is today in `America/Bogota`.
2. The week is Monday through Sunday. Previous week moves back seven days. Next week is disabled when the candidate week is after the current week.
3. **Nueva venta** always opens `/sales?deliveryDate=` for today, not for the selected day.
4. The selected day shows counts of drafts, confirmed sales, voided sales, and the confirmed total.
5. **Entregas** opens `/delivery-sales?deliveryDate=`. **Cargue** opens `/load-sheets?deliveryDate=`.
6. Back from those screens returns to the same selected day.

## 3. Search products and customers

1. Product search on the sale screen calls `GET /products/search?q=` after at least 3 characters. Choosing a hit opens the pending line. The dialog focuses its title so the mobile keyboard does not open by itself.
2. Customer search and create are unchanged. A created or chosen customer opens the sale for the delivery date already on the screen.

## 4. Sale

1. `POST /sales` sends `{ customerId, deliveryDate }` only. The API stores the seller from the session.
2. A draft for the same customer and delivery date is reused.
3. Changing the delivery date of a draft updates that sale. Changing it on a confirmed sale asks for confirmation, then follows the new sale id when the API returns one.
4. A draft cannot be voided. A confirmed sale can be edited or voided, including a sale from a previous week.
5. The sale screen does not link to the invoice preview. That link lives on Entregas.

## 5. Entregas and Cargue

1. Entregas lists drafts, confirmed sales, and voided sales for the delivery date.
2. A confirmed row has the preview icon, edit, and void. A draft has edit only. A voided sale that has an invoice number has only the same preview icon.
3. On a wide screen, Entregas shows **Seleccionar todas**, **Imprimir selección**, and **Imprimir confirmadas** above the list. On a phone those controls and the checkboxes are hidden.
4. Cargue calls `GET /load-sheets?deliveryDate=` and does not print.
5. Preview calls `GET /invoices/:saleId`. The label is **Fecha de entrega**. A voided document shows **ANULADA** on a diagonal and has no print action. Confirmed documents print at 70 mm with a page break between them.

## Still outside this UI

| Area | Where it lives |
|---|---|
| Product administration and Alegra sync | [PDR-003](../pdrs/PDR-003.md). The home button exists and does not open a screen yet. Alegra stays on the API. |
| Choosing a printer or a printer protocol | Windows print dialog. The UI does not record that an invoice was printed. |
