# SPEC-002 — Work by delivery day

**Status:** Proposed (revised 2026-11-01)
**Language:** English
**Architecture:** Feature modules and hexagonal layers, as in [ADR-001](../adrs/ADR-001.md) and [ADR-002](../adrs/ADR-002.md)
**Document role:** Implementation guide for the UI [PDR-002](../pdrs/PDR-002.md). Not a description of the running client.
**API contract:** [SPEC-002](../../../prime-sweets-api/docs/specs/SPEC-002.md).

Do not add catalog import or Alegra calls to this repository.

## 0. Impact on what is already built

| Area | Built | Change |
|---|---|---|
| Delivery date modal before the first product | Yes | Keep. Today through Sunday. |
| Delivery day card with "Cambiar día" | Yes | Keep. Always shown for draft and confirmed. |
| Load Sheet by delivery date | Yes | Keep. Opened from the home day. |
| Deliveries list (`/delivery-sales`) | Yes | Keep. Add drafts and printing. |
| Draft void | Yes | Keep. |
| Week hub of Sales Days, open/close/reopen | Yes | Remove. |
| Closed-day checks in `useDraftSale` and lists | Yes | Remove. |
| Invoices by Sales Day | Version 1 | Replace with delivery date. |
| "Fecha de vencimiento" on the printed invoice | Version 1 | Label "Fecha de entrega", value `deliveryDate`. |

## 1. Navigation

```text
Sign in
   |
   v
Home (/?deliveryDate=, default today)
   |  week row Mon–Sun, < previous week | next week > (capped at current week)
   |
   +-- Nueva venta --> Customer --> delivery day (today–Sunday) --> Sale
   |
   +-- Ventas --> sales of that day --> Sale (correct or void)
   |                               --> select / print invoices
   |
   +-- Cargue --> Load Sheet of that day
```

## 2. Use cases

### Sales

- `CreateSale` sends `customerId` and `deliveryDate`.
- `SetSaleDeliveryDate`, `AddSaleItem`, `UpdateSaleItemQuantity`, `RemoveSaleItem`, `UpdateSaleItemName` (draft only), `ConfirmSale`, `VoidSale`, `GetSale` stay.
- `ListSalesByDeliveryDate` calls `GET /sales?deliveryDate=`. The home summary (drafts, confirmed, voided, confirmed total) is computed from this response; no extra endpoint.
- `SetSaleDeliveryDate` returns a sale. If its id differs from the one sent (confirmed sale re-dated), the view navigates to `/sales?saleId=<new id>`. Before sending, a confirmed sale shows a confirmation: "Se anulará la factura N del día X y se creará una nueva para el día Y."

### Fulfillment output

- `GenerateLoadSheet` calls `GET /load-sheets?deliveryDate=`.
- `ListInvoices` calls `GET /invoices?deliveryDate=`.
- `GenerateInvoice` reads `deliveryDate`. `PrintInvoices` prints it as "Fecha de entrega".

### Removed

`GetCurrentSalesDay`, `ListCurrentWeekSalesDays`, `OpenSalesDay`, `CloseSalesDay`, `ReopenSalesDay`, and the `sales-day` module.

## 3. Domain helpers (display only)

In `sales/domain/deliveryDays.ts`:

- `businessToday()` — today in the business timezone.
- `weekOf(date)` — Monday–Sunday containing `date`.
- `previousWeek(date)`, `nextWeek(date)` — `nextWeek` returns `null` when it would pass the current week.
- `deliveryDaysThroughSunday(today)` — options for a new or moved sale.

## 4. View models

- `Sale` keeps `deliveryDate`; no `salesDayId`.
- `DaySale` (list row) includes `DRAFT`.
- `InvoiceDocument` adds `deliveryDate`.

## 5. Client checks

| Input | Check before the request |
|---|---|
| Delivery date | One of the offered days |
| Quantity | Greater than 0, at most 3 decimal places |
| Item name, when edited | Non-empty trim |
| Void | Explicit confirmation |

`DELIVERY_DATE_REQUIRED`, `DELIVERY_DATE_OUT_OF_RANGE`, and `INVALID_DELIVERY_DATE` map to dictionary strings. Sales Day codes and copy are removed.

## 6. Copy

Remove: Jornada, abrir/cerrar/reabrir jornada, "El cargue aparece al cerrar la jornada…", Semana actual, Ventas del día. The day list is labeled Entregas. Add: Nueva venta, Cargue, Semana anterior, Semana siguiente, summary labels, re-date confirmation for confirmed sales, Fecha de entrega (invoice), out-of-range message. A voided invoice shows ANULADA on a diagonal and cannot be printed. A draft cannot be voided. Print controls are hidden below 40rem.

## 7. Tests

- Creating a sale sends no `salesDayId` and calls no Sales Day endpoint.
- Home defaults to today; the week row shows Monday–Sunday of the selected date.
- Previous week moves back seven days; next week is disabled on the current week.
- Ventas and Cargue use the selected `deliveryDate`; the summary matches the list.
- Re-dating a confirmed sale asks for confirmation and opens the returned new sale.
- A sale from a previous week shows edit and void.
- The printed invoice shows "Fecha de entrega".
- One narrow and one wide pass of home, week navigation, new sale, correction, Load Sheet, and printing.

## 8. Definition of done

- No module imports `sales-day`.
- The view talks to a hook, and the hook calls a use case.
- Totals, invoice numbers, and Load Sheet rows come from the response.
- Empty, error, and success states are visible.
- `architecture/`, `model/`, and `flows/` are updated when the code lands.
