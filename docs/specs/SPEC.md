# SPEC — Frontend application specification

**Status:** Proposed
**Language:** English
**Architecture:** Feature modules, hexagonal layers, React at the UI edge
**Document role:** Target implementation guide for the Version 1 UI. Not a description of the current shell.
**Current implementation:** Shell only. See [docs/README.md](../README.md).

Business invariants, persistence, and HTTP error codes are specified in the Core API SPEC and flows. This file specifies screens, client use cases, view models, and adapters.

## 1. Goals

Allow a seller to run the PDR flow on a phone and on a PC:

authenticate, operate today's Sales Day, select or create a customer, capture and confirm a wholesale sale, void it while the day is open, read a Load Sheet after close, and print invoice documents through the browser print dialog.

## 2. Ownership

| Concern | Owner |
|---|---|
| Session token storage and the print dialog | UI |
| Sales Day status, sale status, totals, invoice numbers, Load Sheet rows, invoice document body | API |
| Mapping an API error code to a message the seller can read | UI |
| Company logo file bytes and legal text | API company profile, rendered by the UI |

The client copies `totalAmount`, `totalProfit`, `invoiceNumber`, Load Sheet lines, and invoice lines from the API. It does not derive them.

## 2.1 Language

Implement this before the next business screen. The running shell and catalog search are still Spanish literals; this section is the target.

| Rule | Detail |
|---|---|
| Locales | `es` (default) and `en` only. |
| What is translated | Navigation, titles, buttons, empty and loading states, client input checks, and messages keyed by API `code`. |
| What is not translated | Product name, customer name, `itemName`, company legal text, invoice number, and money. `formatCurrency` stays `es-CO` / `COP`. |
| Where it lives | Dictionaries and the locale preference sit in `src/shared`, consumed by UI adapters. Domain models and use cases do not receive a locale and do not format sentences. |
| Preference | The shell reads and writes the seller's choice in `localStorage`. Missing or unknown value means `es`. `document.documentElement.lang` matches the active locale. |
| Switch | A control in the shell, visible in the narrow and wide layouts. Changing it does not navigate and does not call the API. |
| Unknown code | Show a generic failure string in the active locale. Do not show the raw API message as a second language. |

New screens and the existing catalog search read strings from the dictionaries. Do not add another hardcoded Spanish sentence in a view.

## 3. Module map

```text
catalog ------------ product search, product display
customers ---------- search, get, create
sales-day ---------- open, current, close, reopen
        \                 |
         \                v
          +----------> sales
                         |
                         v
               fulfillment-output
               Load Sheet, invoice list,
               invoice document, print
```

A module does not import another module's infrastructure. Cross-screen navigation lives in `src/app/`. A sale use case receives the customer id and the Sales Day id; it does not import the customer entity.

## 4. Navigation

```text
Sign in
   |
   v
Sales Day
   |
   +-- open / close / reopen
   |
   +-- Customers --> Sale (draft or existing)
   |
   +-- Load Sheet          (route enabled only when status is CLOSED)
   |
   +-- Invoices --> Invoice preview --> Print
```

Screen-size behavior is specified in section 4.1. Viewport width does not change this route map.

The shell is a top bar, and Sales Day is the hub. Do not add a persistent menu of every section. The sale screen stays one column: customer, search, lines, and total.

Sign-in is implemented. Do not hardcode a `sellerId`. Sales Day open uses the id from the session.

## 4.1 Responsive layout

This section is the implementation guide for the responsive web interface required by the API PDR and by section 2 of the UI PDR. It adds no business action.

The seller uses one application in two viewport classes:

| Class | Matches | Layout |
|---|---|---|
| Narrow | Phone-width viewport, the normal capture device during the visit | One column. The primary action of the screen stays visible without horizontal scrolling. Sale lines, search results, the Load Sheet, and the invoice list stack instead of forcing a wide table. |
| Wide | PC viewport, the normal place for the thermal printer | The same column content may sit beside supporting context (for example the sale lines beside the customer). Tables may use one row per line when the row fits. Capture routes stay on the page. |

Do not add a tablet route, a tablet role, or a third feature set. Widths between the two classes use the same screens and reflow. The stylesheet chooses the switch with `min-width` media queries written next to the view that owns the layout. There is no product-mandated pixel value; the breakpoint must put a typical phone in the narrow class and a typical PC in the wide class, and it is recorded in that stylesheet when the view is built.

Rules:

- Viewport width does not show or hide a use case. In particular, the narrow layout does not remove invoice print, and the wide layout does not remove capture.
- Detecting a phone user-agent is not a layout mechanism. A desktop window that is narrow follows the narrow layout. A phone that is wide follows the wide layout.
- The invoice print stylesheet is not a screen breakpoint. It only formats the invoice documents for the existing thermal-roll width, with the page break between invoices already required by the PDR. The Load Sheet has no print stylesheet.
- Touch targets and text must remain usable in the narrow class without pinch-zoom as the only way to read the sale form.

Where the code lives:

- Layout and media queries belong to `adapters/ui` (view styles and presentational components) or to the shell in `src/app/`.
- Domain models, use cases, and HTTP adapters do not read the viewport and do not branch on it.
- A hook may track a media query when CSS cannot express a presentation swap. That flag stays in the hook and is not an argument of a use case.

The shell records its wide class at `min-width: 64rem` in `src/app/styles.css`. Placeholder routes share that shell. A feature view adds its own media query only when its content needs a different reflow. The shell does not grow a device-specific router.

## 5. Use cases

Each use case is a TypeScript class or function. It receives ports. It does not import React.

### Session

- `SignIn`
- `SignOut`
- `ReadSession`

Blocked until the API has `AuthenticateSeller` and `LogoutSeller`. Maximum 3 sessions is an API rule; the UI only stores the session it was given and sends it on later requests.

### Sales Day

- `GetCurrentSalesDay`
- `OpenSalesDay`
- `CloseSalesDay`
- `ReopenSalesDay`

`CloseSalesDay` and `ReopenSalesDay` run only after the view has recorded an explicit confirmation. The use case still sends the command; the API decides if the day can change.

### Customers

- `SearchCustomers`
- `GetCustomer`
- `CreateCustomer`

Create from the sale visit stays on the customer module and returns the new customer id to the sale screen. Document type, document number, and name are required. Extra invoicing fields stay behind a control that is off by default.

### Catalog

- `SearchProducts`

Search calls `GET /products/search?q=`. The UI does not download the full catalog to filter more than 500 products in the browser. The query covers name, brand, and code because that is what the API search already does.

### Sales

- `CreateSale`
- `AddSaleItem`
- `UpdateSaleItemQuantity`
- `UpdateSaleItemName`
- `RemoveSaleItem`
- `ConfirmSale`
- `VoidSale`
- `GetSale`
- `ListSales`

`AddSaleItem` sends `productId`, a positive `quantity` with at most 3 decimal places, and an optional `itemName`. The price fields are absent from the request. When the seller does not edit the name, the client omits `itemName` and shows the name returned on the sale. The quantity control steps by 1 and also accepts a typed decimal.

`UpdateSaleItemName` is offered only when the sale status is `DRAFT` and the loaded Sales Day status is `OPEN`. If the API rejects the call, the screen shows that error and keeps the stored name.

`ConfirmSale` displays `invoiceNumber` from the response. The client does not format a new sequence.

`VoidSale` is a logical void. The screen does not offer a physical delete.

### Fulfillment output

- `GenerateLoadSheet`
- `ListInvoices`
- `GenerateInvoice`
- `PrintInvoices`

`GenerateLoadSheet` calls `GET /load-sheets/:salesDayId`. The screen does not group rows and does not offer print.

`ListInvoices` calls `GET /invoices?salesDayId=`. `OPEN` and `CLOSED` are both valid.

`GenerateInvoice` calls `GET /invoices/:saleId` for a confirmed sale. `PrintInvoices` loads one document per selected sale, in invoice-number order, and passes them to the print adapter. Reprint calls `GenerateInvoice` again. Voided sales are listed and are not printable, because invoice generation rejects them.

## 6. View models

These are the client models to introduce when each module is built. They are not in the repository yet. Names are the UI language; mappers translate API JSON.

### SalesDay

`id`, `sellerId`, `date`, `status` (`OPEN` | `CLOSED`), `openedAt`, `closedAt`.

### Customer

`id`, `documentType`, `documentNumber`, `name`, `phone`, `email`, `address`.

### Product hit

`id`, `name`, `brandName`, `code`, `wholesalePrice`. `wholesalePrice` is display-only.

### Sale

`id`, `salesDayId`, `customerId`, `status` (`DRAFT` | `CONFIRMED` | `VOIDED`), `invoiceNumber`, `invoiceBusinessDate`, `totalAmount`, `totalProfit`, `totalQuantity`, `items[]`.

### Sale item

`productId`, `itemName`, `quantity`, `wholesalePrice`, `lineTotal`.

### Load sheet line

`productId`, `brand`, `name`, `wholesaleCost`, `wholesaleSalePrice`, `quantity`, `totalPrice`, `profit`.

`wholesaleCost` and `wholesaleSalePrice` may be null when the API could not show one unit snapshot. The UI prints those cells blank. It does not average them.

### Invoice document

Company profile (`name`, `nit`, `city`, `country`, `telephone`, `logo`, `legalText`), tax regime text, customer document and name, `invoiceNumber`, `saleDate`, lines (`productId`, `itemName`, `quantity`, `unitValue`, `lineTotal`), `subtotal`, `total`.

## 7. HTTP adapter

`src/shared/infrastructure/http/httpClient.ts` is the shared transport. Feature adapters implement module ports and map JSON with a mapper in that module.

The API envelope is `{ success, data }` on success. Status mapping today:

| HTTP | UI behavior |
|---|---|
| 200 / 201 | Show the mapped model |
| 400 | Show the domain message and keep the seller on the same screen |
| 404 | Show not-found and leave the stale selection |
| 500 / network | Show a technical failure, distinct from a business rejection |

Known codes the screens must not treat as a crash include `SALES_DAY_NOT_CLOSED`, `SALES_DAY_NOT_OPEN`, `SALE_NOT_INVOICEABLE`, `SALE_MUST_CONTAIN_ITEMS`, and `CUSTOMER_ALREADY_EXISTS`. The adapter preserves `code` and `message` from the body when the API sends them.

`VITE_API_BASE_URL` is the only base URL. There is no direct browser call to Alegra or to PostgreSQL.

## 8. Print adapter

`PrintInvoices` depends on a `InvoicePrintPort`. The browser adapter:

1. Renders the selected documents in invoice-number order.
2. Inserts a page break between documents.
3. Calls the browser print dialog once.

The adapter does not pick a printer, does not send ESC/POS, and does not persist a printed flag. The Load Sheet view has no print action.

## 9. Input checks (client only)

| Input | Check before the request |
|---|---|
| Customer name, document type, document number | Non-empty trim |
| Quantity | Integer greater than 0 |
| Item name, when edited | Non-empty trim |
| Close / reopen | Explicit confirmation already given |

Failed checks do not call the API. They are not a substitute for the API result.

## 10. Folder structure

```text
src/
  app/                          composition root, router
  shared/
    config/
    infrastructure/http/
  modules/
    catalog/
    customers/
    sales-day/
    sales/
    fulfillment-output/
      domain/
      application/
        use-cases/
        ports/
      adapters/
        ui/
          components/
          hooks/
          views/
        infrastructure/
```

Each feature repeats `domain/`, `application/`, and `adapters/`. `fulfillment-output` adds the print adapter under `adapters/infrastructure/`.

## 11. Testing

- Domain: input checks and mappers, without React and without `fetch`.
- Application: use cases with in-memory ports. Assert that confirm, load sheet, and invoice paths do not invent numbers or rows.
- UI: hook tests or component tests for confirmation gates and for hiding price editing and Load Sheet print.
- One browser pass of the touched screens in the narrow class and in the wide class from section 4.1, plus one print-preview path on a PC. The narrow pass checks that the primary action fits without horizontal scrolling. The wide pass checks that capture is still on the page.

## 12. Definition of done

A UI feature is done when:

- its module matches section 3;
- the use case talks to a port, and the view talks to a hook;
- API JSON is mapped before render;
- business totals and invoice numbers come from the response;
- empty, API-error, and success states are visible;
- the narrow and wide layouts from section 4.1 were exercised for the touched screens;
- `architecture/`, `model/`, and `flows/` are updated to match the code that landed.
