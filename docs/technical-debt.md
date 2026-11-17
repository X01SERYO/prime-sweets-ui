# Technical debt register

**Document role:** UI debt that is visible in the current shell.
**Status:** Active — last review 2026-11-17.

Authentication, sale capture, the Load Sheet, and invoice print are implemented. They are not debt. Remaining items are coverage and tooling.

## Confirmed

| ID | Item | Where | Notes |
|---|---|---|---|
| TD-01 | ~~Sample lists are not API-backed~~ | `src/app/composition.ts` | **[RESOLVED]** Customers, day sales, the load sheet, invoices, and sales call HTTP adapters. There is no `Sample*` class. |
| TD-02 | ~~HTTP client drops the API error body~~ | `src/shared/infrastructure/http/httpClient.ts` | **[RESOLVED]** `HttpRequestError` keeps `status`, `message`, and `code` when the body sends them. |
| TD-03 | Coverage far below 85% of the whole UI | `package.json` `test:coverage` | **[RESOLVED]** Vitest with v8 coverage and `all: true` measures every file under `src`. Unit tests live in `src/test/unit` and screen tests in `src/test/integration`. Measured **85.07% lines** (1579/1856). | — |
| TD-13 | ~~Dummy list files~~ | `src/shared/dev/dummyLists.ts`, `src/app/lists/DummyLists.tsx` | **[RESOLVED]** Those files are gone. The screens read the API. |
| TD-04 | ~~ESLint 9 is outside the current support window~~ | `package.json` | **[RESOLVED]** ESLint and `@eslint/js` are on 10. `npm run lint` passes. `react-hooks/set-state-in-effect` stays off: the data hooks set loading state when a request starts. |

## Open after the 2026-11-17 review

Confirmed in code. A use case that only forwards to its port is the module boundary, not debt. The nine classes in `purchasing.useCases.ts` are that boundary; grouping them in one file is TD-12.

| ID | Priority | Item | Where | Problem | Corrective action |
|---|---|---|---|---|---|
| TD-05 | P1 | Sale and purchase rules live in the view | `src/app/App.tsx`; `SaleLines.tsx`; `SupplierDetailView.tsx`; `PurchaseOrderSheetView.tsx` | `App.tsx` repeats `status === 'DRAFT' \|\| status === 'CONFIRMED'` and calls `setSaleDeliveryDate` / `assignSaleCustomer`. `canEditSaleLines` already exists in `sales/domain/saleStatus.ts`. `SaleLines.tsx` rounds `unitPrice * quantity` even though `previewLineTotal` exists in `sales/domain/saleLineName.ts`. Both purchase views validate an integer quantity and drop the detail when it matches the catalog name. Purchasing has no `adapters/ui/hooks`. | Call `canEditSaleLines` and `previewLineTotal` from the hook. One hook per purchasing action. Move the name comparison next to `lineCost.ts`. |
| TD-06 | P2 | Retail application imports catalog domain | `searchRetailProducts.useCase.ts` | Imports `isProductSearchTerm` from `@/modules/catalog/domain/productSearchTerm`. | Move the predicate to `src/shared/domain`, or copy the minimum check into retail if the rule diverges. |
| TD-07 | P2 | Hooks and views run more than one action | `useDraftSale.ts`, `useSaleMutations.ts`, `useRetailToday.ts`, `useDaySummary.ts`, `CustomerFormDialog.tsx`, `ProductAdmin.tsx`, `ProductCreate.tsx` | Draft load lists, creates, or loads by id in one effect. Sale mutations expose accept, quantity, name, and remove. Retail today loads and exposes add, setQuantity, and remove. `useDaySummary.ts` also exports `useWeekSaleCounts`. Catalog views import `HttpRequestError`. | Split command hooks. Give `useWeekSaleCounts` its own file. Translate `HttpRequestError` in the catalog hook. |
| TD-08 | P2 | Money and quantity are calculated in more than one place | `purchasing/domain/lineCost.ts`, `sales/domain/saleLineName.ts`, `SaleLines.tsx`, `ProductAdmin.tsx`, `ProductCreate.tsx` | Three copies of `Math.round(unit * quantity * 100) / 100`. `parseMoney` and `retailUnitCost` are copied in both product screens. Purchase quantity is checked by hand in the views; sales uses thousandths and retail uses an integer ≥ 1. Those two quantity rules are different and stay separate. `SearchCatalogProductsUseCase` throws `new Error('SEARCH_TOO_SHORT')`. `httpProductSearch.ts` and `httpRetailProductSearch.ts` both call `GET /products/search` with different mappers. | One line-total helper in `src/shared/domain/money.ts`. One form money parser for both product screens. A domain error for the short search term. |
| TD-09 | P3 | Search use case names collide | `SearchProductsUseCase` (sales, `GET /products/search`), `SearchCatalogProductsUseCase` (`GET /products`), `SearchRetailProductsUseCase` (same search, retail price) | The names do not say which price or which route. | Rename the sales one to `SearchSaleProductsUseCase` when that module is next touched. |
| TD-10 | P3 | `useInvoices` argument does not match the query | `useInvoices.ts`, `listInvoices.useCase.ts`, `httpInvoiceQuery.ts` | The hook calls the argument `salesDayId`. The use case sends it as `deliveryDate` on `GET /invoices?deliveryDate=`. | Rename the argument to `deliveryDate` together with TD-11. |
| TD-11 | P2 | Invoice list is wired and not shown | `useInvoices.ts`, `src/app/composition.ts` | `useInvoices` is imported only by `src/test/integration/actions.test.tsx`. `container.listInvoices` is built in `composition.ts` and is not used in `App.tsx`. The use case and the port are referenced. Not dead code. | Mount the list screen or remove the container wiring after confirming no other entry. |
| TD-12 | P3 | Purchasing use cases share one file | `purchasing/application/use-cases/purchasing.useCases.ts` | Nine classes. Every other module uses one file per use case. | Split when purchasing hooks (TD-05) are extracted. |
| TD-15 | P3 | Names that do not match the behavior | `SupplierDetailView.tsx` `flavorName`; `useVoidSale` / `useVoidListedSale`; `PurchaseOrderSheetView` and the create call inside `SupplierDetailView` | `flavorName` compares the detail with the catalog name. `useVoidSale` updates the open sale. `useVoidListedSale` voids from the day list and does not return the sale. Both purchase views create an order on different routes. | Rename `flavorName` to the line-detail check. Keep both void hooks and state the return in the hook file. Name the embedded create differently from the `/order` sheet. |
| TD-16 | P3 | UI `GenerateInvoiceUseCase` performs `GET /invoices/:saleId` | fulfillment-output infrastructure | The name says write. The call is a read. The API route is the same GET. | Rename the UI use case only if no other caller depends on the name. Do not change the HTTP verb here. |

## Review on 2026-11-17

Read-only. No view or hook calls `fetch`. The only `fetch` is `src/shared/infrastructure/http/httpClient.ts`. Domain and application do not import i18n. Money formatting goes through `src/shared/domain/money.ts`.

| Check | Result |
|---|---|
| Dead code safe to delete | None. Exported views, hooks, and use cases appear in `App.tsx`, `composition.ts`, or tests. |
| Not mounted | TD-11. Validate before removing the container entry. |
| Open work | TD-05 through TD-12, TD-15, and TD-16. TD-13 and TD-14 in the table above are already resolved. Do TD-05 first, then TD-06 and TD-08, then hook splits and renames. |

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
