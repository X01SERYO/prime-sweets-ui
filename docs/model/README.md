# Client model (current)

**Sources:** `src/shared/config/env.ts`, `src/shared/infrastructure/http/httpClient.ts`, `src/app/composition.ts`.

The running UI has no sale, customer, product, Sales Day, Load Sheet, or invoice model. Those view models are specified in [SPEC § 6](../specs/SPEC.md) and must be added here only after the matching module exists in `src/modules/`.

## Environment

| Field | Source | Meaning |
|---|---|---|
| `apiBaseUrl` | `import.meta.env.VITE_API_BASE_URL` | Core API origin. Falls back to `http://localhost:3000` when the variable is missing. |

`.env.example` documents the variable. `.env` is local and is not committed.

## HTTP client

| Operation | Behavior |
|---|---|
| `get(path)` | `GET {apiBaseUrl}{path}`. Parses JSON on a 2xx response. Throws `Error` with `HTTP {status}` otherwise. |
| `post(path, body)` | `POST` with `Content-Type: application/json`. Same success and error behavior as `get`. |

The client is untyped at the boundary (`Promise<T>` asserted from `response.json()`). Feature mappers are not written yet. There is no error `code` field on this client.

## Composition

`AppContainer` is `{ http, apiBaseUrl }`. `App` reads `apiBaseUrl` only.

## Not stored

The browser does not persist a session, a draft sale, or a printed flag. There is no IndexedDB, `localStorage`, or offline queue in this repository.
