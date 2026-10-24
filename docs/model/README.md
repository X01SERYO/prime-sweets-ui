# Client model (current)

**Sources:** `src/shared/config/env.ts`, `src/shared/infrastructure/http/httpClient.ts`, `src/app/composition.ts`.

Sale, customer, Sales Day, Load Sheet, and invoice models are not in code. They stay in [SPEC § 6](../specs/SPEC.md) until those modules exist.

## Product hit

`src/modules/catalog/domain/models/productHit.ts`, mapped from `GET /products/search`.

| Field | API source |
|---|---|
| `id` | `id` |
| `name` | `name`, or null |
| `code` | `alegraId` |
| `wholesalePrice` | `wholesalePrice`, number or numeric string, otherwise null |

The search response does not include the brand name. `brandName` from the SPEC is not stored on this hit.

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
