# Technical debt register

**Document role:** UI debt that is visible in the current shell.
**Status:** Active.

Business gaps (authentication, capture, print) are specified in the [PDR](./pdrs/PDR.md) and [SPEC](./specs/SPEC.md). They are not repeated here as debt.

## Confirmed

| ID | Item | Where | Notes |
|---|---|---|---|
| TD-01 | Sample lists are not API-backed | `src/modules/customers`, `src/modules/sales`, `src/modules/fulfillment-output` | Customers, day sales, the load sheet, and invoices read in-memory sample adapters. Replace each `Sample*` class with an HTTP adapter and register the use case in `src/app/composition.ts`. |
| TD-02 | ~~HTTP client drops the API error body~~ | `src/shared/infrastructure/http/httpClient.ts` | **[RESOLVED]** `HttpRequestError` keeps `status`, `message`, and `code` when the body sends them. |
| TD-03 | Thin automated tests | `src/test/architecture.test.ts` | `npm test` covers currency format and domain error codes. Screen flows are not covered. |
| TD-13 | ~~Dummy list files~~ | `src/shared/dev/dummyLists.ts`, `src/app/lists/DummyLists.tsx` | **[RESOLVED]** Those files are gone. Sample rows now sit behind module ports. |
| TD-04 | ESLint 9 is outside the current support window | `package.json` | `npm install` warns that ESLint 9 is deprecated. Lint still passes. Moving to ESLint 10 is a tooling change, not a feature. |

## Resolved with the shell

| ID | Item |
|---|---|
| — | `baseUrl` removed from `tsconfig.app.json` so the TypeScript 6 deprecation is not an error. Path alias `@/*` remains. |
| — | Prettier and `.cursorignore` match the API project. `.eslintignore` is intentionally absent because ESLint 9 reads `ignores` from `eslint.config.js`. |
