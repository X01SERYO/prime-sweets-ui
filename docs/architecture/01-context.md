# C4 Level 1 — System Context (current)

**Sources:** `src/`, `package.json`, `.env.example`.

The UI is the seller SPA. Routes cover login, the current Sales Day, customers, day sales, a sale, the load sheet, the invoice list, and invoice preview. Signed-out visitors go to `/login`. Printing uses the browser print dialog.

## Diagram

```mermaid
C4Context
title Prime Sweets UI — System Context (current)

Person(seller, "Seller", "Opens the web application in a browser")
System(ui, "Prime Sweets UI", "Vite/React SPA for the seller day, sales, load sheet, and invoices")
System_Ext(api, "Prime Sweets Core API", "Identity, catalog, customers, Sales Day, sales, Load Sheet, and invoice documents")

Rel(seller, ui, "Signs in and works the day")
Rel(ui, api, "Bearer JSON", "HTTP")
```

## People

| Person | Relationship in code |
|---|---|
| Seller | Signs in, works today's Sales Day, and prints invoices from the browser. |

## External systems

| System | Role in code |
|---|---|
| Prime Sweets Core API | Named by `VITE_API_BASE_URL` (default `http://localhost:4000`). Every business screen calls it with the bearer token. |
| Alegra | Not a UI dependency. Product sync stays in the API. |
| PostgreSQL | Not a UI dependency. |
| Windows printer | Used only through the browser print dialog. The UI does not pick a device or speak a printer protocol. |
