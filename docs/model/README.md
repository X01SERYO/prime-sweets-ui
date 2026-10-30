# Client model (current)

**Sources:** `src/shared/config/env.ts`, `src/shared/infrastructure/http/httpClient.ts`, `src/app/composition.ts`.

The client models the session, the current Sales Day, the product hit, the customer, the sale and its lines, the day-sale row, the load sheet, and the invoice summary and document.

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
| `apiBaseUrl` | `import.meta.env.VITE_API_BASE_URL` | Core API origin. Falls back to `http://localhost:4000` when the variable is missing. |

`.env.example` documents the variable. `.env` is local and is not committed.

## HTTP client

| Operation | Behavior |
|---|---|
| `get(path)` | `GET {apiBaseUrl}{path}` with the bearer token when a session exists. Parses JSON on a 2xx response. |
| `post(path, body)` | `POST` with `Content-Type: application/json`. Same success and error behavior as `get`. |

A non-2xx response throws `HttpRequestError` with `status`, `message`, and `code` when the body sends them. Feature mappers turn the JSON into domain models.

## Composition

`AppContainer` wires the HTTP client and the use cases for identity, catalog, customers, the Sales Day, sales, the load sheet, and invoices. `App` uses those use cases. It does not call the API itself.

## Browser storage

The session is stored in `sessionStorage`. The language choice is stored in `localStorage`. A draft sale and a printed flag are not stored in the browser. There is no IndexedDB and no offline queue.
