# C4 Level 3 — Components (current)

**Sources:** `src/app/`, `src/shared/`, `src/modules/`.

The SPA has a composition root and a shared HTTP helper. `src/modules/` has no feature code.

## Diagram

```mermaid
C4Component
title Prime Sweets UI — Components (current)

Container_Boundary(spa, "Prime Sweets UI") {
  Component(boot, "Browser entry", "main.tsx", "Finds #root and renders App inside StrictMode")
  Component(composition, "Composition root", "createAppContainer", "Reads env and builds the HTTP client")
  Component(shell, "Startup view", "App.tsx", "Shows the title and the configured API base URL")
  Component(env, "Environment", "shared/config/env.ts", "VITE_API_BASE_URL")
  Component(http, "HTTP client", "createHttpClient", "get and post JSON. No caller yet")
}

System_Ext(api, "Prime Sweets Core API")

Rel(boot, composition, "Creates the container")
Rel(boot, shell, "Passes the container")
Rel(composition, env, "Reads the base URL")
Rel(composition, http, "Builds the client")
Rel(shell, composition, "Reads apiBaseUrl")
Rel(http, api, "Not called by the shell")
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

There is no router and no module for catalog, customers, sales day, sales, or fulfillment output.
