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
| [model/](./model/README.md) | Client structures verified in code | Session, catalog hit, sales day, sale, load sheet, and invoice models. |
| [flows/](./flows/README.md) | User and application flows verified in code | Login through invoice print. Remaining gaps are listed, not invented. |
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
| Feature modules (`identity`, `catalog`, `customers`, `sales-day`, `sales`, `fulfillment-output`) | Yes. Each screen calls the API through its use cases. |
| Seller session | Yes — login, logout, bearer token, and `sessionStorage`. The seller id comes from the session. |
| Sales Day, customer, sale, Load Sheet, and invoice screens | Yes. Open, close, and reopen; customer search and create; draft lines with decimal quantity; confirm and void; load sheet table; invoice list, preview, and print. |
| Invoice printing through the browser print dialog | Yes — one dialog, page break between selected invoices, oldest invoice number first inside that dialog. |
| Narrow and wide shell (SPEC § 4.1) | Partial — navigation reflows at `64rem`. Lists stay one table on both widths. |
| Spanish default and English option (SPEC § 2.1) | Yes for the current screens. The choice is stored in `localStorage`. |

When a SPEC step is implemented, update `architecture/`, `model/`, and `flows/` to match the code. Do not mark SPEC sections as done only in the SPEC.
