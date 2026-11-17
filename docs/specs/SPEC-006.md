# SPEC-006 — Pedidos

**Status:** Implemented
**Language:** English
**Architecture:** Feature module per [ADR-001](../adrs/ADR-001.md) and [ADR-005](../adrs/ADR-005.md).
**Document role:** Record of the Pedidos screens built for [PDR-006](../pdrs/PDR-006.md).
**API contract:** [SPEC-005](../../../prime-sweets-api/docs/specs/SPEC-005.md).

## 0. Impact on what is already built

| Area | Built | Change |
|---|---|---|
| Shell navigation | Por mayor, Detal, Cargue, Productos, Pedidos | **Pedidos** uses the same sidebar / bottom-bar switch. |
| `sales`, `retail-sales`, catalog admin, load sheet | Yes | None. |
| Catalog product search port | Yes | Reused when linking products to a supplier. |
| New module `src/modules/purchasing` | Yes | List, supplier order screen, HTTP adapter, and use cases. |
| i18n | Yes | Keys for the section, sheet columns, save, and the "detail no longer kept" state, in `es` and `en`. |

The running screens are also summarized in `flows/`.

## 1. Module

```
src/modules/purchasing/
  domain/models/supplier.ts, purchaseOrder.ts
  application/use-cases/
  application/ports/
  adapters/infrastructure/   # HTTP + mappers
  adapters/ui/views/         # supplier list, supplier products, order sheet, order header
```

Domain models match the API sheet: `previousQuantity`, `lastQuantity`, and `lastItemName` are nullable on the supplier product. The typed quantity lives in the view, not in the domain.

Line cost and order total before save are pure functions in `domain/` (integer quantity, unit cost from the server, round half-up to 2 decimals). The hook calls them. They are not a second pricing rule; after save the UI shows `totalCost` from the response.

## 2. Screens

| Route | View |
|---|---|
| `/purchasing` | Supplier list. Create, and rename on the same row as the name. |
| `/purchasing/:supplierId` | New order. Reference column is the latest order. Entry column is empty and dated today. |
| `/purchasing/:supplierId?order=:orderId` | Edit the latest order. Reference column is the previous order. Entry column is that order's quantity. |

`/purchasing/:supplierId/order` and `/purchasing/orders/:orderId` are still registered. The list does not open them.

## 3. Sheet behavior

- Load `GET /suppliers/:id` and `GET /purchase-orders?supplierId=&page=1&pageSize=2` for the two dates.
- Create posts `POST /purchase-orders`. Edit patches `PATCH /purchase-orders/:id`.
- Cantidad accepts digits. Empty and `"0"` are skipped. The client does not send `unitCost`.
- A stored `lastItemName` is sent again so an extra is not cleared. The table does not edit that name.
- Leave the route without Guardar: no request, no local persistence.

## 4. Checks

- Phone width and a PC width: **Pedidos** is visible, the sheet can be filled, Guardar returns to the supplier, and a second new order shows Cantidad anterior.
- Saving a line whose name adds "fresa" shows `CHOCOLATINA fresa` on the latest order and not on the previous one.
- Por mayor sale lines, Detal, and Productos still load.
