# Technical debt register

**Document role:** UI debt that is visible in the current shell.
**Status:** Active.

Business gaps (authentication, capture, print) are specified in the [PDR](./pdrs/PDR.md) and [SPEC](./specs/SPEC.md). They are not repeated here as debt.

## Confirmed

| ID | Item | Where | Notes |
|---|---|---|---|
| TD-01 | Remaining feature modules | `src/modules/` | Catalog search exists. Customers, sales day, sales, and fulfillment output are not modules yet. |
| TD-02 | ~~HTTP client drops the API error body~~ | `src/shared/infrastructure/http/httpClient.ts` | **[RESOLVED]** `HttpRequestError` keeps `status`, `message`, and `code` when the body sends them. |
| TD-03 | No automated tests | repository root | No test script and no test files. |
| TD-04 | ESLint 9 is outside the current support window | `package.json` | `npm install` warns that ESLint 9 is deprecated. Lint still passes. Moving to ESLint 10 is a tooling change, not a feature. |

## Resolved with the shell

| ID | Item |
|---|---|
| — | `baseUrl` removed from `tsconfig.app.json` so the TypeScript 6 deprecation is not an error. Path alias `@/*` remains. |
| — | Prettier and `.cursorignore` match the API project. `.eslintignore` is intentionally absent because ESLint 9 reads `ignores` from `eslint.config.js`. |
