# C4 Level 3 — Components (current)

**Sources:** `src/app/`, `src/shared/`, `src/modules/`.

The SPA has a composition root, a shared HTTP client, and one hexagonal module per seller area: identity, catalog, customers, sales day, sales, and fulfillment output.

## Diagram

```mermaid
C4Component
title Prime Sweets UI — Components (current)

Container_Boundary(spa, "Prime Sweets UI") {
  Component(boot, "Browser entry", "main.tsx", "Finds #root and renders App inside StrictMode")
  Component(composition, "Composition root", "createAppContainer", "Reads env and builds the HTTP client")
  Component(shell, "App shell", "App.tsx, styles.css, shared/i18n", "Top bar, ES/EN, and the signed-in routes")
  Component(env, "Environment", "shared/config/env.ts", "VITE_API_BASE_URL")
  Component(http, "HTTP client", "createHttpClient", "JSON with the bearer token")
}

System_Ext(api, "Prime Sweets Core API")

Rel(boot, composition, "Creates the container")
Rel(boot, shell, "Passes the container")
Rel(composition, env, "Reads the base URL")
Rel(composition, http, "Builds the client")
Rel(shell, composition, "Calls use cases")
Rel(http, api, "Bearer JSON")
```

## Folder map

```text
src/
  main.tsx
  app/
    App.tsx
    composition.ts
    styles.css
  shared/
    config/env.ts
    infrastructure/http/httpClient.ts
  modules/                    empty
```

Routes: `/sales-day`, `/customers`, `/sales`, `/load-sheets`, `/invoices`. `/` redirects to `/sales-day`. There is still no module for catalog, customers, sales day, sales, or fulfillment output.
