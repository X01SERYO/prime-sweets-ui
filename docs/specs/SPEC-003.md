# SPEC-003 — Product administration

**Status:** Proposed
**Language:** English
**Architecture:** Feature modules and hexagonal layers, as in [ADR-001](../adrs/ADR-001.md) and [ADR-003](../adrs/ADR-003.md)
**Document role:** Implementation guide for the UI [PDR-003](../pdrs/PDR-003.md). Not a description of the running client.
**API contract:** [SPEC-003](../../../prime-sweets-api/docs/specs/SPEC-003.md).

The browser calls only this API. It does not call Alegra.

## 0. Impact on what is already built

| Area | Built | Change |
|---|---|---|
| **Productos** button on the home row, left of **Nueva venta** | Yes, no action | Navigate to the product administration screen. |
| Product search while adding a sale line | Yes | Keep. The API omits retired products. |
| Excel import and Alegra | Not in this client | Stay out. |

## 1. Table

Route owned by the catalog module. The home link does not append `deliveryDate`. The table reads `GET /products/search`. There is no pagination in that contract; this screen does not add one.

| Column | Source | Edit |
|---|---|---|
| Código | `code` | No |
| Nombre | stored `name` | No. It is not derived from the code. Both are already stored. |
| % de ganancia | Client only, default `15` | Yes. Not a product field and not sent. |
| Sugerido | Display | No |
| Costo por mayor | `wholesaleCost` | Yes |
| Precio por mayor | `wholesalePrice` | Yes |
| Ganancia real por mayor | Display | No |
| Costo por menor | `retailCost` | Yes |
| Precio por menor | `retailPrice` | Yes |
| Ganancia real por menor | Display | No |
| UND | `units` | Yes. Integer, as stored. |
| PACK | `pack` | Yes. Integer, as stored. |
| Marca | Brand name from the current product | No. `PUT` does not change `brandId` in this feature. |

Código and nombre identify the product. The name is the stored name, so it cannot drift from another copy.

**Sugerido** is `wholesaleCost * (1 + percent / 100)`, rounded to two decimals. It changes when the wholesale cost or the percent changes. It is a reference. It does not write `wholesalePrice` and it does not write the stored `suggestedPrice`. The stored suggested price and this display are different; the display wins on this screen. If `wholesaleCost` is null, show `N/A`.

**Ganancia real** for a channel is `(price - cost) / cost`, shown as a percent. It uses the cost, not the sale price. If cost is null or `0`, or price is null, show `N/A`. Do not show `Infinity` or `NaN`. A price below the cost shows a negative percent. A price equal to the cost shows `0%`.

Editable numbers accept `0` and reject negatives. The check runs in the client and again on the API. Empty input is not sent.

Save sends one `PUT /products/:id` with only the fields that changed. A change to `0` is included and, when it is a sale price, the API also sends it to Alegra. An empty cell is not a save. Unchanged cells are omitted. The row then shows the saved values. Cost, units, and pack are stored and are not sent to Alegra.

## 2. Search

Reuse `GET /products/search?q=`. One term matches product code, product name, brand name, or brand code. The query already returns each product once.

Do not call the API until the term has at least 3 characters. The sale search already uses that minimum and runs on an explicit submit, not on each key. This table does the same: Enter or the search action. No request while the seller is still typing under that length.

## 3. Layout

On a wide screen the row is a table. Horizontal scroll is allowed when the columns do not fit; code and name stay identifiable.

On a phone, including 360 px wide, each product is a card. Code and name are the heading. Editable fields and the calculated fields stack. The save action stays on the card.

## 4. Definition of done

- **Productos** opens this table on a 360 px wide phone and on the PC.
- Suggested price and both real margins update as the seller edits, without writing the sale price.
- A save of one cell does not send the rest of the row.
- A value of `0` is saved. A negative value is rejected in the client and by the API.
- Search finds by code, name, or brand from 3 characters and does not query earlier.
- Architecture, model, and flows describe only the code that has landed.
