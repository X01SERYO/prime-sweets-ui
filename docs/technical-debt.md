# Technical debt register

**Document role:** UI debt that is visible in the current shell.
**Status:** Active.

Business gaps (authentication, capture, print) are specified in the [PDR](./pdrs/PDR.md) and [SPEC](./specs/SPEC.md). They are not repeated here as debt.

## Confirmed

| ID | Item | Where | Notes |
|---|---|---|---|
| TD-01 | No feature modules | `src/modules/` | The shell routes to placeholders. ADR-001 modules are still empty. |
| TD-02 | HTTP client drops the API error body | `src/shared/infrastructure/http/httpClient.ts` | A non-2xx response becomes `Error('HTTP {status}')`. The SPEC needs `code` and `message` before seller screens can distinguish a business rejection from a failure. |
| TD-03 | No automated tests | repository root | No test script and no test files. |
| TD-04 | ESLint 9 is outside the current support window | `package.json` | `npm install` warns that ESLint 9 is deprecated. Lint still passes. Moving to ESLint 10 is a tooling change, not a feature. |

## Resolved with the shell

| ID | Item |
|---|---|
| — | `baseUrl` removed from `tsconfig.app.json` so the TypeScript 6 deprecation is not an error. Path alias `@/*` remains. |
| — | Prettier and `.cursorignore` match the API project. `.eslintignore` is intentionally absent because ESLint 9 reads `ignores` from `eslint.config.js`. |
