# SPEC-004 — Daily retail sale

**Status:** Proposed
**Language:** English
**Architecture:** Feature modules and hexagonal layers, as in [ADR-001](../adrs/ADR-001.md)
**Document role:** Implementation guide for the UI [PDR-004](../pdrs/PDR-004.md). Not a description of the running client.
**API contract:** [SPEC-004](../../../prime-sweets-api/docs/specs/SPEC-004.md). Business decisions: API [PDR-004 §6](../../../prime-sweets-api/docs/pdrs/PDR-004.md).

## 0. Impact on what is already built

| Area | Built | Change |
|---|---|---|
| Home row (`WeekHome`) | **Productos**, **Nueva venta**, week, wholesale summary, Entregas and Cargue shortcuts | Becomes the **Por mayor** section. Productos and Cargue move to the main navigation (§A). |
| Main navigation | None; everything starts from `WeekHome` | New app shell with four sections (§A). |
| Load Sheet (`/load-sheets`) | Reached from the wholesale day shortcut | Own section **Cargue** with its own day selector. Same route and API. |
| `sales` module, invoices, Load Sheet | Yes | None. |
| Sale product search (modal) | Yes | Not reused as UI. Its search port/adapter is reused. |
| Pager in `ProductAdmin` | Inline: previous / next, `page / pages`, size select 10–50 | Extract to `shared/ui/Pager.tsx`; `ProductAdmin` and Días anteriores both use it. No visual change to Productos. |
| New module `retail-sales` | No | Create with `domain`, `application`, `adapters/infrastructure`, `adapters/ui`. |
| i18n | Yes | New keys (es/en): `retailSale`, `totalSold`, `totalProfit`, `retailUnitPrice`, `addToList`, `deleteRow`, `closeTill`, `selectPage`, `selectedDays`, `daysReviewed`, `unreviewed`, `reviewed`, `noRetailCost`, `newDayStarted`, etc. |

## A. Navigation and UX analysis

### Problem today

`WeekHome` mixes three things on one screen: the wholesale week, entry points that do not depend on the week (Productos), and the Load Sheet, which is reached only through a wholesale day. Adding retail there would make one screen answer four questions ("what did I invoice", "what did I sell at the counter", "what do I load", "what are my prices"). The seller could not tell at a glance which totals are wholesale and which are retail.

### Decision: four sections, one question each

| Section | Question it answers | Date model | Accent |
|---|---|---|---|
| **Por mayor** | What did I sell to customers and invoice? | Delivery date, current week | Blue |
| **Detal** | What did I sell at the counter? | Business day; only today editable | Green |
| **Cargue** | What must go on the truck? | Delivery date | Amber |
| **Productos** | What are my prices? | None | Neutral |

Principles:

1. **One section, one question, one date model.** Wholesale and Cargue use delivery dates; Detal uses the business day. Never both on the same screen.
2. **Totals are always labelled with their channel** ("Total por mayor", "Total detal"). No unlabelled "Total".
3. **Persistent navigation**, so the seller never goes back to home to switch section.
4. **Colour + icon + text** per section; colour is never the only cue.
5. **Primary action visible without scrolling**: "Nueva venta" (Por mayor), product search (Detal), day selector (Cargue).
6. **Pending work is the default view, not a notification**: Días anteriores opens on **Sin revisar**. No badge.

### Layout

- **Phone (≤ 768 px):** fixed bottom tab bar with the four sections (icon + short label). The active tab uses the section accent. Each section header shows its title and its date control.
- **PC:** left sidebar with the same four entries in the same order; content on the right.
- Current URLs stay valid; the shell only wraps them. `/` redirects to **Por mayor**.

### Routes per section

| Section | Routes |
|---|---|
| Por mayor | `/` (week), `/sales`, `/delivery-sales` (invoices) |
| Detal | `/retail-sales` (Hoy), `/retail-sales/history?status=&page=&pageSize=` (Días anteriores) |
| Cargue | `/load-sheets?deliveryDate=` with its own week day selector |
| Productos | `/products` |

The wholesale week screen keeps a "Ver cargue de este día" link that opens Cargue on the same date; Cargue does not depend on it.

## 1. Detal tabs

Two tabs at the top of the section: **Hoy** and **Días anteriores**.

## 2. Hoy

### Layout

```
Hoy · sáb 14 nov                         [ Sin revisar ]

[ Buscar producto (código, nombre, marca) ..................... 🔍 ]
  ┌ inline results list ─────────────────────────────┐
  │ A12 · Jet · Chocolatina · $1.500                 │
  │ B07 · Jumbo · Maní · $2.000                      │
  └──────────────────────────────────────────────────┘
Seleccionado: A12 · Jet · Chocolatina · $1.500   Cantidad [ 1 ]  [ + Agregar ]

Total detal vendido: $ X        Total detal ganancia: $ Y
┌────────┬───────┬───────────────┬──────────────────────────────┬──────────┬───┐
│ Código │ Marca │ Producto      │ Precio de venta detal unidad │ Cantidad │   │
├────────┼───────┼───────────────┼──────────────────────────────┼──────────┼───┤
│ A12    │ Jet   │ Chocolatina ⚠ │ $1.500                       │ [  3  ]  │ 🗑 │
└────────┴───────┴───────────────┴──────────────────────────────┴──────────┴───┘
Total detal vendido: $ X        Total detal ganancia: $ Y
```

- Both totals blocks render the same values from the API response.
- The last column is the delete action, without a header label (`aria-label="Eliminar"`).
- Phone (360 px): the picker stacks (search, list, then selected product with quantity and **+ Agregar** full width). Each row is a card: code + product as heading, brand and unit price below, quantity input and delete button on the card. Totals stay above and below the list.

### Product picker (two steps)

1. Reuse `GET /products/search?q=` with the existing 3-character minimum and explicit submit (Enter or search button).
2. Results render as a list anchored under the input (`role="listbox"`, arrows + Enter, Escape closes). No modal.
3. Each option shows code, brand, name, and retail price. Products without retail price are disabled.
4. **Selecting does not call the API.** It closes the list and fills the "Seleccionado" line with the product and a **Cantidad** input (default `1`, focused and selected so the seller can type over it).
5. **+ Agregar** (or Enter in Cantidad) calls `POST /retail-days/today/items { productId, quantity }`. Disabled until the quantity is an integer ≥ 1.
6. On success: replace the day with the response, clear the search and the selection, focus the search input for the next product, and briefly highlight the affected row. If the product was already on the list, the API added the quantity to it; the highlight shows which row grew.

### Product without retail cost

When an item has `hasCost: false`, the row shows a warning icon next to the product name with the tooltip "Producto sin costo detal: la ganancia no se calcula". On a phone it opens on tap. The icon has `aria-label` with the same text. The selected-product line shows the same warning before adding, when the search result has no retail cost.

### Row quantity

- Integer input, min `1`. `0`, negatives, and decimals are rejected in the client before sending; to take a product out, use delete.
- Save on blur or Enter with `PATCH /retail-days/today/items/:productId { quantity }`, only when changed. An empty input restores the last saved value.
- Replace the day with the response; totals always come from the API.
- While saving, the row shows a pending state; on error the input reverts and an alert shows the translated error code.

### Delete row

- Delete button per row calls `DELETE /retail-days/today/items/:productId`. No confirmation dialog; the row is small and easy to re-add.
- Deleting the last row leaves Hoy empty; the API deleted the day, so it does not appear in Días anteriores.

### No review action on Hoy

Hoy has no **Cerrar caja** button. Today is closed from Días anteriores (§3). If today was already reviewed there, Hoy shows the closed state and, when the API sends them, **Revisado por** and **Revisado el**. There is no search, no table, and no inputs.

### Day boundaries and sessions

- Today's list is always read from `GET /retail-days/today` on load and when the tab becomes visible again; the browser is never the source of truth.
- If a write response has a `businessDate` different from the one shown (midnight passed), show "Empezó un nuevo día" and reload Hoy.
- `RETAIL_DAY_CLOSED`: show the message and reload Hoy.

## 3. Días anteriores

- Two views as segmented buttons: **Sin revisar** (default) and **Revisados**. The view, page, and page size live in the URL query, so back/forward and reload keep them.
- Reads `GET /retail-days?status=&page=&pageSize=` with `pageSize` default **10**, using the shared `Pager`. Productos uses that same component.
- Each reviewed day is one row, title above the value: sale date, total vendido, total ganancia, **Revisado por**, **Revisado el**. Sin revisar keeps the date and the two totals, plus the row checkbox. There is no product detail for past days. Days without sales do not exist, so they never appear.

### Sin revisar: select and close

```
[✓] Seleccionar página
[✓] Hoy · sáb 14 nov     $ 85.000   ganancia $ 21.000
[✓] vie 13 nov · hace 1 día   $ 120.000   ganancia $ 30.500
[ ] mié 11 nov · hace 3 días  $ 64.000    ganancia $ 15.200
──────────────────────────────────────────────────────────
2 días seleccionados · Total vendido $ 205.000 · Ganancia $ 51.500
                                           [ Cerrar caja (2) ]
```

- Each entry has a checkbox; the whole row/card toggles it (large touch target on phone). "Seleccionar página" selects or clears every entry of the current page.
- Selection is limited to the current page and is cleared when the page, page size, or view changes.
- A summary bar shows the number of selected days and the **accumulated** total vendido and total ganancia, computed in the client from the listed values. On phone it is a sticky bar at the bottom, above the tab bar; on PC it sits under the table.
- **Cerrar caja (n)** is disabled with no selection. One click opens a single confirmation with the count, the accumulated totals, and: "Estos días pasarán a Revisado y no podrán volver a Sin revisar. Si incluye hoy, no podrá registrar más ventas detal hoy."
- Confirm calls `POST /retail-days/review { dates }`. On success: toast "n días revisados", clear the selection, reload the page; if it becomes empty, go to the previous page.
- On 409 (one already reviewed, e.g. from another device), show the message and reload the list; nothing was changed.
- "hace N días" never shows as expired.

### Revisados

- Read-only: who reviewed and when. No checkboxes, no action, no way back.
- Empty states: "No hay ventas detal pendientes de revisión" / "Aún no hay ventas detal revisadas".
- Status badges: **Sin revisar** (amber, clock icon), **Revisado** (green, check icon).

## 4. Module layout

```
src/modules/retail-sales/
  domain/models/retailDay.ts, retailDaySummary.ts
  domain/quantity.ts
  application/ports/retailDay.port.ts
  application/use-cases/{getTodayRetailDay,listRetailDays,addRetailItem,setRetailItemQuantity,removeRetailItem,reviewRetailDays}.useCase.ts
  adapters/infrastructure/httpRetailDay.ts, retailDayMapper.ts
  adapters/ui/hooks/useRetailToday.ts, useRetailHistory.ts
  adapters/ui/views/RetailTodayView.tsx, RetailHistoryView.tsx, RetailProductPicker.tsx, RetailLines.tsx, RetailTotals.tsx, CloseTillDialog.tsx
src/shared/ui/Pager.tsx
src/app/AppShell.tsx   (bottom bar / sidebar)
```

Wire in `src/app/composition.ts` and `App.tsx`.

## 5. Definition of done

- The four sections are reachable from the bottom bar on phone and the sidebar on PC, from any screen.
- **Detal → Hoy** works on a 360 px phone and on the PC.
- Selecting a product does not add it; quantity + **+ Agregar** does. Adding an existing product increases its row.
- Editing a quantity or deleting a row updates both totals above and below the table.
- A product without retail cost shows the warning tooltip.
- Hoy has no review action.
- In Sin revisar, selecting days shows their accumulated totals, and one **Cerrar caja** moves all of them to Revisados. Including today closes it for the rest of the day. There is no way back.
- Deleting the last row of today leaves no stored day.
- Días anteriores opens on Sin revisar, 10 per page, with the same pager as Productos.
- Productos pagination looks and behaves as before after the pager extraction.
- Invoices, Nueva venta, and Cargue flows unchanged.
