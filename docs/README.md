# Documentation

**Language:** English is the official language for documentation, matching the Core API.

This index is the map of the Prime Sweets UI documents. Runtime descriptions below match the current frontend codebase. Version 1 product and design decisions live in the PDR, SPEC, and ADR; they are not described here as implemented.

Business rules (Sales Day, sale totals, invoice numbering, Load Sheet aggregation) stay in the Core API documents. This set does not copy them as a second source of truth.

## Document map

| Document | Role | Status vs code |
|---|---|---|
| [pdrs/PDR.md](./pdrs/PDR.md) | UI product design requirement for Version 1 | Proposal. Not a description of the running UI. |
| [specs/SPEC.md](./specs/SPEC.md) | Frontend implementation specification for Version 1 | Proposed target. Use it as the implementation guide. |
| [adrs/ADR-001.md](./adrs/ADR-001.md) | Architecture decision: one SPA, feature modules, hexagon per module | Proposed. Binding for Version 1. Current runtime shape is in `architecture/`. |
| [architecture/](./architecture/README.md) | C4 model of **the current UI** | Implemented. One C4 set only. |
| [model/](./model/README.md) | Client structures verified in code | Shell configuration and HTTP client only. Version 1 view models are named in the SPEC. |
| [flows/](./flows/README.md) | User and application flows verified in code | Application boot and catalog search. Pending Version 1 flows are listed, not invented. |
| [mocks/](./mocks/README.md) | Visual guide for seller screens | Reference. Not a second SPEC. |
| [technical-debt.md](./technical-debt.md) | Register of UI technical debt | Active. |

## Authority

| Topic | Source |
|---|---|
| Business rules, states, formulas, invoice content | Core API [PDR](../../../prime-sweets-api/docs/pdrs/PDR.md) and [SPEC](../../../prime-sweets-api/docs/specs/SPEC.md) |
| HTTP behavior that exists today | Core API [flows](../../../prime-sweets-api/docs/flows/README.md) |
| What the seller sees and which device does what | This repository's PDR |
| How the SPA is built | This repository's SPEC and ADR-001 |
| What the SPA does today | This repository's architecture, model, and flows |

## SPEC coverage in the current codebase

| SPEC area | In the UI today |
|---|---|
| Vite + React + TypeScript shell | Yes |
| Composition root and shared HTTP client | Yes |
| Feature modules (`catalog`, `customers`, `sales-day`, `sales`, `fulfillment-output`) | Catalog search, customers, login, and the current Sales Day call the API. Day sales, the load sheet, and invoices use sample adapters. |
| Seller session | Yes — login, logout, and the bearer token. The seller id comes from the session. |
| Sales Day, customer, sale, Load Sheet, and invoice screens | Sales Day loads and opens. Customers search, create, and hand the id to `/sales`. Day sales, the load sheet, and invoices still render sample rows. Close, sale lines, and print are not built. |
| Invoice printing through the browser print dialog | No |
| Narrow and wide shell (SPEC § 4.1) | Partial — navigation reflows at `64rem`. Feature screens are placeholders. |
| Spanish default and English option (SPEC § 2.1) | Partial — the shell and the sale search use the dictionaries. New screens must use them too. |

When a SPEC step is implemented, update `architecture/`, `model/`, and `flows/` to match the code. Do not mark SPEC sections as done only in the SPEC.
