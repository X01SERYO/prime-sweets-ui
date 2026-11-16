# SPEC-006 — Pedidos

**Status:** Proposed
**Language:** English
**Architecture:** Feature module per [ADR-001](../adrs/ADR-001.md) and [ADR-005](../adrs/ADR-005.md).
**Document role:** Implementation guide for [PDR-006](../pdrs/PDR-006.md). Not a description of the running client.
**API contract:** [SPEC-005](../../../prime-sweets-api/docs/specs/SPEC-005.md).

## 0. Impact on what is already built

| Area | Built | Change |
|---|---|---|
| Shell navigation | Por mayor, Detal, Cargue, Productos | Add **Pedidos**. Same sidebar / bottom-bar switch. |
| `sales`, `retail-sales`, catalog admin, load sheet | Yes | None. |
| Catalog product search port | Yes | Reused when linking products to a supplier. |
| New module `src/modules/purchasing` | No | Create. |
| i18n | Yes | Keys for the section, sheet columns, save, and the "detail no longer kept" state, in `es` and `en`. |

Do not copy this file into `architecture/`, `model/`, or `flows/` until the screens call the API.

## 1. Module

```
src/modules/purchasing/
  domain/models/supplier.ts, purchaseOrder.ts
  application/use-cases/
  application/ports/
  adapters/infrastructure/   # HTTP + mappers
  adapters/ui/views/         # supplier list, supplier products, order sheet, order header
```

Domain models match the API sheet: `lastQuantity` and `lastNote` are nullable numbers/strings on the supplier product. The unsaved row (`quantityInput`, `noteInput`) lives in the view hook, not in the domain.

Line cost and order total before save are pure functions in `domain/` (integer quantity, unit cost from the server, round half-up to 2 decimals). The hook calls them. They are not a second pricing rule; after save the UI shows `totalCost` from the response.

## 2. Screens

| Route | View |
|---|---|
| `/purchasing` | Supplier list, create, rename. |
| `/purchasing/:supplierId` | Linked products, search to link, unlink, list of past order headers, link to new order. |
| `/purchasing/:supplierId/order` | Sheet. Guardar posts and then navigates back to the supplier. |
| `/purchasing/orders/:orderId` | Header always. Lines only when `hasLines` is true. Otherwise one sentence: the detail is kept only for the latest order. |

## 3. Sheet behavior

- Load `GET /suppliers/:id`. Render one row per linked product.
- A local filter narrows rows by code, brand, or name. It does not refetch.
- Cantidad accepts an empty string or digits. On Guardar, skip empty and `"0"`. Reject a non-integer in the field with the API code `INVALID_PURCHASE_QUANTITY` surfaced as a form error if the API returns it.
- Note is sent only when non-empty after trim.
- The client does not send `unitCost`.
- Leave the route without Guardar: no request, no local persistence.

## 4. Checks

- Phone width and a PC width: **Pedidos** is visible, the sheet can be filled, Guardar returns to the supplier, and a second new order shows Cantidad anterior.
- Saving with a note shows that note on the latest order and not on the previous one.
- Por mayor sale lines, Detal, and Productos still load.
