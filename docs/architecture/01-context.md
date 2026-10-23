# C4 Level 1 — System Context (current)

**Sources:** `src/`, `package.json`, `.env.example`.

The UI is a browser shell. It shows the configured API base URL. It does not load brands, customers, sales days, sales, a Load Sheet, or an invoice. It does not open a print dialog.

## Diagram

```mermaid
C4Context
title Prime Sweets UI — System Context (current)

Person(seller, "Seller", "Opens the web application in a browser")
System(ui, "Prime Sweets UI", "Vite/React shell that reads VITE_API_BASE_URL and renders a startup page")
System_Ext(api, "Prime Sweets Core API", "Catalog, customers, Sales Day, sales, Load Sheet, and invoice documents. Not called at startup")

Rel(seller, ui, "Opens the page")
Rel(ui, api, "No request on the current screen", "HTTP JSON when a feature module exists")
```

## People

| Person | Relationship in code |
|---|---|
| Seller | Opens the SPA. There is no sign-in screen and no role switch. |

## External systems

| System | Role in code |
|---|---|
| Prime Sweets Core API | Named by `VITE_API_BASE_URL` (default `http://localhost:3000`). The shell constructs an HTTP client and does not issue a request. |
| Alegra | Not a UI dependency. Product sync stays in the API. |
| PostgreSQL | Not a UI dependency. |
| Windows printer | Not used. Printing is specified in the PDR and is not implemented. |
