# Screen mocks

**Source:** Prime Sweets v1 mocks. These screens are the visual guide for the seller UI. They do not add business rules beyond the PDR.

The shell follows the mock chrome: a top bar and the Sales Day screen as the hub. A side menu of every section is not in the mocks.

## Screens

| Mock | Viewport | What it shows | In the app |
|---|---|---|---|
| Sign in, validation | Phone | User, password, empty-field messages, ES/EN | Login and logout call the API. The email field starts empty. |
| Sign in, rejected credentials | PC | Same form, credential error | Built. A rejected password shows the translated error. |
| Open Sales Day and close confirmation | Phone | Date, ABIERTA, Clientes, Ventas del día, Cerrar jornada, confirm card | Current day loads and can be opened. Close and the confirmation card are not built. |
| Closed Sales Day | PC | CERRADA, Cargue, Facturas, Reabrir jornada | Not built. |
| Customers, search and create error | Phone | Search, pick, create, duplicate document error | Sample list behind a port. Search and create are not built. |
| Day sales | Phone | Draft, confirmed, and voided sales | Sample list at `/day-sales`. |
| Sale draft | Phone | Customer, product search, lines, totals, Confirmar venta | Search card only. Lines and confirm are not built. |
| Sale draft | PC | Search beside the line table | Search card only. The second column arrives with the lines. |
| Load Sheet | Phone | One card per product. No print. | Sample cards behind a port. |
| Load Sheet | PC | Read-only table: brand, wholesale cost, wholesale price, name, quantity, total, profit | Sample cards. The table layout arrives with the API screen. |
| Invoices | Phone | Number, customer, total, status. Voided is not printable. | Sample list behind a port. |
| Invoices | PC | Select rows and preview the invoice document | Sample list. Selection and preview arrive with the API screen. |

## Layout taken from the mocks

- Top bar on every screen, with the language control labeled `ES | EN`.
- One column on a phone. On a PC, the sale draft splits search and lines only when lines exist.
- Primary action: orange pill. Secondary action: white pill with a deep outline.
- Groups sit in cards with a 14px radius and a `#E7EEEE` border.
- Wholesale price is shown and is not an input.
- Load Sheet and invoices are reached after the Sales Day is closed. The open-day mock says so in a sentence; it does not print the Load Sheet.
