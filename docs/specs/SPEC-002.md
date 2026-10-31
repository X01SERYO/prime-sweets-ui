# SPEC-002 — Current week and delivery day

**Status:** Proposed
**Language:** English
**Architecture:** Feature modules and hexagonal layers, as in [ADR-001](../adrs/ADR-001.md) and [ADR-002](../adrs/ADR-002.md)
**Document role:** Implementation guide for the UI [PDR-002](../pdrs/PDR-002.md). Not a description of the running client.
**API contract:** [SPEC-002](../../../prime-sweets-api/docs/specs/SPEC-002.md). The client copies delivery dates, totals, invoice numbers, and Load Sheet rows from the API.

Do not add catalog import or Alegra calls to this repository.

## 1. Navigation

```text
Sign in
   |
   v
Current week
   |
   +-- one Sales Day of this week --> Customers --> delivery date --> Sale
   |
   +-- Delivery date --> sales for that date --> Sale (correct or void)
   |
   +-- Delivery date --> Load Sheet
   |
   +-- Invoices --> preview --> print
```

The week route replaces the rolling 7-day list. Invoice print stays the Version 1 flow. Viewport width does not hide correction or the Load Sheet.

## 2. Use cases

### Sales Day

- `ListCurrentWeekSalesDays` calls `GET /sales-days/current-week`.
- `GetCurrentSalesDay`, `OpenSalesDay`, `CloseSalesDay`, and `ReopenSalesDay` stay. Close and reopen still require an explicit confirmation. A closed day hides new sale, edit, and void until the seller reopens it.

### Sales

- `CreateSale` sends `customerId`, `salesDayId`, and `deliveryDate`.
- `SetSaleDeliveryDate` sends the date the seller confirmed.
- `AddSaleItem`, `UpdateSaleItemQuantity`, `RemoveSaleItem`, `UpdateSaleItemName`, `ConfirmSale`, `VoidSale`, `GetSale`, and the day list stay.

`AddSaleItem` is not called when the sale has no delivery date. The view asks for the date first. An empty date does not call the API.

`UpdateSaleItemName` remains available only for `DRAFT`.

`VoidSale` is the "remove completely" action. The view shows that confirmation before the request.

### Fulfillment output

- `ListSalesByDeliveryDate` calls `GET /sales?deliveryDate=`. The client does not filter a week cache locally.
- `GenerateLoadSheet` calls `GET /load-sheets?deliveryDate=`.
- `ListInvoices`, `GenerateInvoice`, and `PrintInvoices` stay.

The Load Sheet view has no print action. A relative logo path stays resolved with the API base URL.

## 3. View models

`Sale` gains `deliveryDate`. The mapper reads it from the API. The view does not invent it from the Sales Day date.

`SalesDay` is unchanged. The week screen renders the list the API returned.

Load Sheet lines are unchanged. The screen subtitle is the delivery date, not the Sales Day id.

## 4. Client checks

| Input | Check before the request |
|---|---|
| Delivery date | A calendar date is present |
| Quantity | Greater than 0, at most 3 decimal places |
| Item name, when edited | Non-empty trim |
| Void | Explicit confirmation already given |

`SALE_OUTSIDE_EDIT_WINDOW`, `DELIVERY_DATE_REQUIRED`, and `DELIVERY_DATE_BEFORE_SALE` map to dictionary strings. An unknown code uses the generic failure string. The raw API message is not shown as a second language.

## 5. Copy

New strings go in the `es` and `en` dictionaries: week title, delivery-date prompt, void confirmation, Load Sheet date prompt, and the three error codes above. Product names, customer names, and invoice numbers stay untranslated.

## 6. Tests

- The create path does not call `AddSaleItem` before a delivery date is stored.
- The week view renders only the days in the API payload.
- Void is not sent without confirmation.
- The Load Sheet request uses `deliveryDate` and does not call `/load-sheets/:salesDayId`.
- One narrow and one wide pass of the week hub, the delivery-date step, a correction, and the Load Sheet.

## 7. Definition of done

- The three modules match section 2.
- The view talks to a hook, and the hook calls a use case.
- Totals, invoice numbers, and Load Sheet rows come from the response.
- Empty, error, and success states are visible.
- `architecture/`, `model/`, and `flows/` are updated when the code lands, not before.
