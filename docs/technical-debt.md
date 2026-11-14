# Technical debt register

**Document role:** UI debt that is visible in the current shell.
**Status:** Active.

Authentication, sale capture, the Load Sheet, and invoice print are implemented. They are not debt. Remaining items are coverage and tooling.

## Confirmed

| ID | Item | Where | Notes |
|---|---|---|---|
| TD-01 | ~~Sample lists are not API-backed~~ | `src/app/composition.ts` | **[RESOLVED]** Customers, day sales, the load sheet, invoices, and sales call HTTP adapters. There is no `Sample*` class. |
| TD-02 | ~~HTTP client drops the API error body~~ | `src/shared/infrastructure/http/httpClient.ts` | **[RESOLVED]** `HttpRequestError` keeps `status`, `message`, and `code` when the body sends them. |
| TD-03 | Coverage far below 85% of the whole UI | `package.json` `test:coverage` | **[RESOLVED]** Vitest with v8 coverage and `all: true` measures every file under `src`. Unit tests live in `src/test/unit` and screen tests in `src/test/integration`. Measured **85.07% lines** (1579/1856). | — |
| TD-13 | ~~Dummy list files~~ | `src/shared/dev/dummyLists.ts`, `src/app/lists/DummyLists.tsx` | **[RESOLVED]** Those files are gone. The screens read the API. |
| TD-04 | ~~ESLint 9 is outside the current support window~~ | `package.json` | **[RESOLVED]** ESLint and `@eslint/js` are on 10. `npm run lint` passes. `react-hooks/set-state-in-effect` stays off: the data hooks set loading state when a request starts. |

## Review on 2026-11-14

| Check | Result |
|---|---|
| Coverage | **[RESOLVED]** TD-03 is 85.07% lines (1579/1856) with Vitest `all: true`. |
| Architecture docs | **[RESOLVED]** `docs/architecture/03-component.md` listed an empty `modules/` tree and a Sales Day home. It now lists identity, catalog, customers, sales, and fulfillment output, and the routes that `App.tsx` actually registers. |
| Flows | **[RESOLVED]** Product admin is `/products` and `/products/new`. The retail section in PDR-004 is not built. |
| Unused screens | No unused view was deleted. The old dummy lists were already removed (TD-13). |
| Tooling | **[RESOLVED]** TD-04. ESLint 10 is installed and `npm run lint` passes. |

## Resolved with the shell

| ID | Item |
|---|---|
| — | `baseUrl` removed from `tsconfig.app.json` so the TypeScript 6 deprecation is not an error. Path alias `@/*` remains. |
| — | Prettier and `.cursorignore` match the API project. `.eslintignore` is intentionally absent because ESLint 10 reads `ignores` from `eslint.config.js`. |
