# Screen mocks

**Source:** Prime Sweets v1 mocks. These screens are the visual guide for the seller UI. They do not add business rules beyond the PDR.

The shell follows the mock chrome: a top bar and the Sales Day screen as the hub. A side menu of every section is not in the mocks.

## Screens

| Mock | Viewport | What it shows | In the app |
|---|---|---|---|
| Sign in, validation | Phone | User, password, empty-field messages, ES/EN | Not built. Blocked on API authentication. |
| Sign in, rejected credentials | PC | Same form, credential error | Not built. |
| Open Sales Day and close confirmation | Phone | Date, ABIERTA, Clientes, Ventas del día, Cerrar jornada, confirm card | Hub only. Status and close are not loaded. |
| Closed Sales Day | PC | CERRADA, Cargue, Facturas, Reabrir jornada | Not built. |
| Customers, search and create error | Phone | Search, pick, create, duplicate document error | Dummy list. Remove `dummyLists.ts` when the API is wired. |
| Day sales | Phone | Draft, confirmed, and voided sales | Dummy list at `/day-sales`. |
| Sale draft | Phone | Customer, product search, lines, totals, Confirmar venta | Search card only. Lines and confirm are not built. |
| Sale draft | PC | Search beside the line table | Search card only. The second column arrives with the lines. |
| Load Sheet | Phone | One card per product. No print. | Dummy cards. |
| Load Sheet | PC | Read-only table: brand, wholesale cost, wholesale price, name, quantity, total, profit | Dummy cards. The table layout arrives with the API screen. |
| Invoices | Phone | Number, customer, total, status. Voided is not printable. | Dummy list. |
| Invoices | PC | Select rows and preview the invoice document | Dummy list. Selection and preview arrive with the API screen. |

## Layout taken from the mocks

- Top bar on every screen, with the language control labeled `ES | EN`.
- One column on a phone. On a PC, the sale draft splits search and lines only when lines exist.
- Primary action: orange pill. Secondary action: white pill with a deep outline.
- Groups sit in cards with a 14px radius and a `#E7EEEE` border.
- Wholesale price is shown and is not an input.
- Load Sheet and invoices are reached after the Sales Day is closed. The open-day mock says so in a sentence; it does not print the Load Sheet.
