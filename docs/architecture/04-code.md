# C4 Level 4 — Code (current)

**Verified flow:** boot the SPA, restore the session, and open the Sales Day when the seller is signed in.

**Sources:** `src/main.tsx`, `src/app/composition.ts`, `src/app/App.tsx`, `src/shared/config/env.ts`, `src/shared/infrastructure/http/httpClient.ts`.

Sale capture, the Load Sheet, and invoice print are use cases behind this boot path. Their screens are in [flows](../flows/README.md).

## Dependencies

```mermaid
classDiagram
  class Main {
    createRoot
  }
  class CreateAppContainer {
    +createAppContainer() AppContainer
  }
  class App {
    +container
  }
  class Env {
    +apiBaseUrl
  }
  class HttpClient {
    <<interface>>
    +get()
    +post()
  }
  class CreateHttpClient {
    +createHttpClient(baseUrl) HttpClient
  }

  Main --> CreateAppContainer
  Main --> App
  CreateAppContainer --> Env
  CreateAppContainer --> CreateHttpClient
  CreateHttpClient ..|> HttpClient
  App --> CreateAppContainer
```

## Sequence

```mermaid
sequenceDiagram
  actor Seller
  participant Main
  participant Container as createAppContainer
  participant Env
  participant Http as createHttpClient
  participant App

  Seller->>Main: Open /
  Main->>Container: createAppContainer()
  Container->>Env: read VITE_API_BASE_URL
  Env-->>Container: base URL or http://localhost:4000
  Container->>Http: createHttpClient(baseUrl)
  Http-->>Container: client
  Container-->>Main: AppContainer
  Main->>App: render(container)
  App-->>Seller: Title and base URL
```

No `fetch` runs in this startup sequence. `HttpClient.get` and `HttpClient.post` throw when the response is not OK and otherwise return the JSON body. Login, the current Sales Day, and product search map that body in their infrastructure adapters. The four lists do not call the API.
