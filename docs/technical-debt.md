# Technical debt register

**Document role:** UI debt that is visible in the current shell.
**Status:** Active.

Authentication, sale capture, the Load Sheet, and invoice print are implemented. They are not debt. Remaining items are coverage and tooling.

## Confirmed

| ID | Item | Where | Notes |
|---|---|---|---|
| TD-01 | ~~Sample lists are not API-backed~~ | `src/app/composition.ts` | **[RESOLVED]** Customers, day sales, the load sheet, invoices, and sales call HTTP adapters. There is no `Sample*` class. |
| TD-02 | ~~HTTP client drops the API error body~~ | `src/shared/infrastructure/http/httpClient.ts` | **[RESOLVED]** `HttpRequestError` keeps `status`, `message`, and `code` when the body sends them. |
| TD-03 | Thin automated tests | `src/test/architecture.test.ts` | `npm test` covers currency format and domain error codes. Screen flows are not covered. |
| TD-13 | ~~Dummy list files~~ | `src/shared/dev/dummyLists.ts`, `src/app/lists/DummyLists.tsx` | **[RESOLVED]** Those files are gone. The screens read the API. |
| TD-04 | ESLint 9 is outside the current support window | `package.json` | `npm install` warns that ESLint 9 is deprecated. Lint still passes. Moving to ESLint 10 is a tooling change, not a feature. |

## Resolved with the shell

| ID | Item |
|---|---|
| — | `baseUrl` removed from `tsconfig.app.json` so the TypeScript 6 deprecation is not an error. Path alias `@/*` remains. |
| — | Prettier and `.cursorignore` match the API project. `.eslintignore` is intentionally absent because ESLint 9 reads `ignores` from `eslint.config.js`. |
