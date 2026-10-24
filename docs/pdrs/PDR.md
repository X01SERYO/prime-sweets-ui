# PDR — Prime Sweets seller UI

**Status:** Proposal
**Language:** English
**Scope:** Version 1
**Document role:** Product design requirement for the web client. Not a description of the current UI.

The business source of truth is the Core API PDR (*Store-to-Store Sales Digitization*). This document states only what the client must do so a seller can complete that process. It does not redefine Sales Day rules, sale formulas, invoice numbering, Load Sheet aggregation, or customer identity.

## 1. Purpose

Replace the seller's notebook and the later Excel transcription with one responsive web application. The seller captures orders during the store visit and, after the Sales Day is closed, reads the Load Sheet and prints invoices on the PC that already has the thermal printer.

## 2. Users and devices

There is one application and no PC-only or phone-only business role.

| Device | Normal use |
|---|---|
| Phone | Capture during the store visit: Sales Day, customer, sale, confirm. |
| PC | The same capture, plus invoice printing through the Windows print dialog. |

The phone does not talk to the printer. No Bluetooth, USB, or Wi-Fi printer integration is in Version 1.

The layout is responsive: the same screens reflow between a phone-width viewport and a PC viewport. Width does not add or remove a business action, and it does not create a second application or a device role. Capture stays available on the PC. Printing stays the browser print dialog already defined for the PC that has the thermal printer; a narrower viewport does not become a different product. Technical layout rules are in the UI SPEC. They do not change this section.

## 2.1 Language

The seller-facing chrome is Spanish by default, with an English option in the same application. The choice does not change the seller, the route, or a business rule.

Spanish and English cover labels, buttons, empty states, validation hints, and messages mapped from API error codes. They do not cover data the business stored: product names, customer names, sale-item names, company legal text, or invoice numbers. The printed invoice keeps the company profile text supplied by the API. Currency display stays Colombian pesos.

This language step is next, before the remaining SPEC screens.

## 3. What the seller can do

1. Sign in once and keep a session. The same account may stay signed in on phone and PC at the same time, up to 3 sessions (API PDR OQ-05).
2. Open and use today's Sales Day, close it, and reopen only today's Sales Day, each close/reopen behind an explicit confirmation.
3. Find an existing customer or create one during the visit.
4. Create a sale, search the catalog by name, brand, or code, add quantities, and edit the sale-item name before confirmation.
5. See the wholesale price. The seller cannot type a different price.
6. Confirm the sale and see the invoice number returned by the API.
7. Continue with the next customer without an end-of-day wait.
8. While the Sales Day is open, correct a draft and void a confirmed sale.
9. After close, open the Load Sheet for that day. The Load Sheet is read on screen. It is not printed.
10. List invoices for the Sales Day and print one, several, or all of them from the PC. Reprint uses the same document.

Internet is required. There is no offline queue.

## 4. What the UI does not decide

The API is authoritative for:

- whether a Sales Day is open and whether it may be reopened;
- sale totals, profit, and price/cost snapshots;
- invoice number allocation and reuse;
- which sales enter the Load Sheet and how rows are grouped;
- invoice line names, totals, company profile, and legal text.

The UI may check obvious input before sending it (empty name, quantity greater than zero, close confirmation). A failed API result wins over that check.

## 5. Screens

| Screen | When it is available | Primary actions |
|---|---|---|
| Sign in | No session | Authenticate |
| Sales Day | Session exists | Open today, see status, close, reopen today |
| Customers | Sales Day is open | Search, select, create |
| Sale | Sales Day is open and a customer is selected | Search products, add lines, edit item name and quantity, remove lines, confirm, void |
| Load Sheet | Sales Day is closed | Read the grouped sheet |
| Invoices | Session exists and the day has allocated invoices | List, open one document, print, reprint |

Closing the day is not required to list invoices. The Load Sheet stays unavailable while the day is open, including after a reopen. Draft sales do not appear as invoices. Voided sales stay in the invoice list and cannot be printed.

## 6. Invoice print

Printing is a client action:

1. The UI loads each selected invoice document from the API.
2. It lays the documents out for the thermal roll, with a page break between invoices.
3. It opens the browser print dialog so Windows shows the printer already installed for that roll.
4. Nothing in the UI or the API records that an invoice was printed.

The seller chooses the printer in that dialog, as in the current Excel flow.

## 7. Acceptance criteria

- The same screens are usable on a phone-width viewport and on a PC, with the same actions. Layout reflow is specified in the UI SPEC.
- The seller can switch the chrome between Spanish and English. Spanish is the default. Stored business text is not translated.
- Capture does not require the seller to wait until the day is closed.
- The sale form has no price input.
- Item name can be edited only while the sale is a draft and the Sales Day is open.
- Confirm shows the invoice number from the API response.
- Close and reopen ask for confirmation before the request is sent.
- The Load Sheet screen calls the API only for a closed day and does not offer print.
- Print sends one or more API invoice documents through one browser print dialog.
- The UI does not calculate an invoice number or a Load Sheet grouping locally.

## 8. Out of scope

Inventory, offline mode, a native app, device roles, direct printer protocols, catalog Excel import, and Alegra administration. Those stay outside this client even when the API later grows them.
