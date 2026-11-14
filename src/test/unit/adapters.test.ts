// @vitest-environment jsdom
import assert from 'node:assert/strict';
import { test } from 'vitest';
import { HttpSale } from '../../modules/sales/adapters/infrastructure/httpSale.ts';
import { saleErrorKey } from '../../modules/sales/adapters/ui/hooks/saleErrorKey.ts';
import { SaleAlreadyVoidedError } from '../../modules/sales/domain/errors/saleAlreadyVoided.error.ts';
import { SaleCannotBeModifiedError } from '../../modules/sales/domain/errors/saleCannotBeModified.error.ts';
import { SaleDayClosedError } from '../../modules/sales/domain/errors/saleDayClosed.error.ts';
import { SaleInvalidError } from '../../modules/sales/domain/errors/saleInvalid.error.ts';
import { SaleMustContainItemsError } from '../../modules/sales/domain/errors/saleMustContainItems.error.ts';
import { SaleOutsideEditWindowError } from '../../modules/sales/domain/errors/saleOutsideEditWindow.error.ts';
import { DeliveryDateBeforeSaleError } from '../../modules/sales/domain/errors/deliveryDateBeforeSale.error.ts';
import { DeliveryDateOutOfRangeError } from '../../modules/sales/domain/errors/deliveryDateOutOfRange.error.ts';
import { DeliveryDateRequiredError } from '../../modules/sales/domain/errors/deliveryDateRequired.error.ts';
import { createHttpClient, HttpRequestError } from '../../shared/infrastructure/http/httpClient.ts';
import { BrowserSessionStore } from '../../modules/identity/adapters/infrastructure/browserSessionStore.ts';
import { HttpAuth } from '../../modules/identity/adapters/infrastructure/httpAuth.ts';
import { InvalidCredentialsError } from '../../modules/identity/domain/errors/invalidCredentials.error.ts';
import { toInvoiceDocument, toInvoiceSummaries } from '../../modules/fulfillment-output/adapters/infrastructure/invoiceMapper.ts';
import { toLoadSheetLines } from '../../modules/fulfillment-output/adapters/infrastructure/loadSheetMapper.ts';
import { LoadSheetInvalidError } from '../../modules/fulfillment-output/domain/errors/loadSheetInvalid.error.ts';
import { invoiceErrorKey, invoiceErrorKind } from '../../modules/fulfillment-output/adapters/ui/hooks/invoiceErrorKey.ts';
import { InvoiceInvalidError } from '../../modules/fulfillment-output/domain/errors/invoiceInvalid.error.ts';
import { InvoiceNotPrintableError } from '../../modules/fulfillment-output/domain/errors/invoiceNotPrintable.error.ts';
import { CompanyProfileNotConfiguredError } from '../../modules/fulfillment-output/domain/errors/companyProfileNotConfigured.error.ts';
import { BrowserInvoicePrint } from '../../modules/fulfillment-output/adapters/infrastructure/browserInvoicePrint.ts';
import { HttpCatalogProduct } from '../../modules/catalog/adapters/infrastructure/httpCatalogProduct.ts';
import { CatalogInvalidError } from '../../modules/catalog/domain/errors/catalogInvalid.error.ts';
import { HttpCustomerCommand } from '../../modules/customers/adapters/infrastructure/httpCustomerCommand.ts';
import { CustomerAlreadyExistsError } from '../../modules/customers/domain/errors/customerAlreadyExists.error.ts';
import { HttpInvoiceQuery } from '../../modules/fulfillment-output/adapters/infrastructure/httpInvoiceQuery.ts';
import type { HttpClient } from '../../shared/infrastructure/http/httpClient.ts';
import type { InvoiceDocumentModel } from '../../modules/fulfillment-output/domain/models/invoiceSummary.ts';

const sale = {
  id: 's1',
  sellerId: 'u1',
  customerId: 'c1',
  status: 'DRAFT',
  captureDate: '2026-11-14',
  deliveryDate: '2026-11-14',
  invoiceNumber: null,
  totalAmount: 1000,
  totalProfit: 200,
  totalQuantity: 1,
  createdAt: '2026-11-14T00:00:00Z',
  items: [{ id: 'i1', productId: 'p1', itemName: 'SODA', quantity: 1, wholesalePrice: 1000, totalPrice: 1000 }]
};

function client(result: unknown): HttpClient {
  const ok = async (path = '') => (String(path).includes('?') ? { success: true, data: [sale] } : result);
  return { get: ok, post: ok, put: ok, patch: ok, delete: ok, url: path => path };
}

test('HttpSale runs every command and maps API error codes', async () => {
  const sales = new HttpSale(client({ success: true, data: sale }));
  assert.equal((await sales.create('c1', '2026-11-14')).id, 's1');
  assert.equal((await sales.listDrafts('2026-11-14', 'c1')).length, 1);
  assert.equal((await sales.listByDeliveryDate('2026-11-14')).length, 1);
  assert.equal((await sales.get('s1')).id, 's1');
  assert.equal((await sales.addItem('s1', 'p1', 1, 'SODA')).id, 's1');
  assert.equal((await sales.updateQuantity('s1', 'i1', 2)).id, 's1');
  assert.equal((await sales.updateName('s1', 'i1', 'SODA')).id, 's1');
  assert.equal((await sales.removeItem('s1', 'i1')).id, 's1');
  assert.equal((await sales.setDeliveryDate('s1', '2026-11-15')).id, 's1');
  assert.equal((await sales.confirm('s1')).id, 's1');
  assert.equal((await sales.void('s1')).id, 's1');

  const codes: Array<[string, new () => Error]> = [
    ['SALES_DAY_NOT_OPEN', SaleDayClosedError],
    ['SALE_MUST_CONTAIN_ITEMS', SaleMustContainItemsError],
    ['SALE_ALREADY_VOIDED', SaleAlreadyVoidedError],
    ['SALE_CANNOT_BE_MODIFIED', SaleCannotBeModifiedError],
    ['SALE_OUTSIDE_EDIT_WINDOW', SaleOutsideEditWindowError],
    ['DELIVERY_DATE_REQUIRED', DeliveryDateRequiredError],
    ['DELIVERY_DATE_BEFORE_SALE', DeliveryDateBeforeSaleError],
    ['DELIVERY_DATE_OUT_OF_RANGE', DeliveryDateOutOfRangeError]
  ];
  for (const [code, ErrorType] of codes) {
    const failing = new HttpSale({
      ...client(null),
      post: async () => {
        throw new HttpRequestError(400, 'no', code);
      }
    });
    await assert.rejects(() => failing.create('c1', '2026-11-14'), ErrorType);
  }
  await assert.rejects(() => new HttpSale(client({ success: false })).get('s1'), SaleInvalidError);
});

test('sale and invoice error keys name every domain error', () => {
  assert.equal(saleErrorKey(new SaleDayClosedError(), 'saleInvalid'), 'saleDayClosed');
  assert.equal(saleErrorKey(new SaleOutsideEditWindowError(), 'saleInvalid'), 'saleOutsideEditWindow');
  assert.equal(saleErrorKey(new DeliveryDateRequiredError(), 'saleInvalid'), 'deliveryDateRequired');
  assert.equal(saleErrorKey(new DeliveryDateBeforeSaleError(), 'saleInvalid'), 'deliveryDateBeforeSale');
  assert.equal(saleErrorKey(new DeliveryDateOutOfRangeError(), 'saleInvalid'), 'deliveryDateOutOfRange');
  assert.equal(saleErrorKey(new SaleMustContainItemsError(), 'saleInvalid'), 'saleMustContainItems');
  assert.equal(saleErrorKey(new SaleAlreadyVoidedError(), 'saleInvalid'), 'saleAlreadyVoided');
  assert.equal(saleErrorKey(new SaleCannotBeModifiedError(), 'saleInvalid'), 'saleCannotBeModified');
  assert.equal(saleErrorKey(new SaleInvalidError(), 'saleInvalid'), 'saleInvalid');
  assert.equal(saleErrorKey(new Error('x'), 'saleInvalid'), 'saleInvalid');
  assert.equal(invoiceErrorKey(new InvoiceNotPrintableError(), 'invoiceInvalid'), 'invoiceNotPrintable');
  assert.equal(invoiceErrorKey(new CompanyProfileNotConfiguredError(), 'invoiceInvalid'), 'companyProfileMissing');
  assert.equal(invoiceErrorKey(new InvoiceInvalidError(), 'invoiceInvalid'), 'invoiceInvalid');
  assert.equal(invoiceErrorKind(new InvoiceNotPrintableError()), 'business');
  assert.equal(invoiceErrorKind(new Error('x')), 'technical');
});

test('the HTTP client sends each verb and keeps the API error', async () => {
  const calls: string[] = [];
  globalThis.fetch = (async (_url: string, init?: RequestInit) => {
    calls.push(init?.method ?? 'GET');
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  }) as typeof fetch;
  const http = createHttpClient('http://api.test/', () => 'token');
  assert.equal(http.url('/sales'), 'http://api.test/sales');
  assert.equal(http.url('http://other/x'), 'http://other/x');
  await http.get('/a');
  await http.post('/a', {});
  await http.put('/a', {});
  await http.patch('/a', {});
  await http.delete('/a');
  assert.deepEqual(calls, ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);

  globalThis.fetch = (async () => new Response(JSON.stringify({ error: 'no', code: 'X' }), { status: 400 })) as typeof fetch;
  await assert.rejects(() => http.get('/a'), (error: unknown) => error instanceof HttpRequestError && error.code === 'X');
});

test('the session store drops a bad, expired, or missing session', () => {
  const store = new BrowserSessionStore();
  store.clear();
  assert.equal(store.read(), null);
  sessionStorage.setItem('prime-sweets.session', '{');
  assert.equal(store.read(), null);
  store.write({
    token: 't',
    expiresAt: '2000-01-01T00:00:00.000Z',
    user: { id: 'u', email: 'a@b.co', displayName: 'Ada' }
  });
  assert.equal(store.read(), null);
  store.write({
    token: 't',
    expiresAt: '2099-01-01T00:00:00.000Z',
    user: { id: 'u', email: 'a@b.co', displayName: 'Ada' }
  });
  assert.equal(store.read()?.user.displayName, 'Ada');
});

test('login maps a session and a rejected password', async () => {
  const session = { token: 't', expiresAt: '2099-01-01T00:00:00.000Z', user: { id: 'u', email: 'a@b.co', displayName: 'Ada' } };
  const auth = new HttpAuth(client({ success: true, data: session }));
  assert.equal((await auth.login({ email: 'a@b.co', password: 'x' })).token, 't');
  await auth.logout('t');
  const denied = new HttpAuth({
    ...client(null),
    post: async () => {
      throw new HttpRequestError(401, 'no', 'INVALID_CREDENTIALS');
    }
  });
  await assert.rejects(() => denied.login({ email: 'a@b.co', password: 'x' }), InvalidCredentialsError);
});

test('invoice and load sheet mappers reject a broken payload and print a ticket', () => {
  const invoice = toInvoiceDocument({
    companyName: 'Dulceria',
    companyNit: '1',
    city: 'Bogota',
    country: 'CO',
    telephone: '1',
    logo: '/logo.webp',
    taxRegime: 'simple',
    legalText: 'Gracias',
    customerDocumentType: 'CC',
    customerDocumentNumber: '1',
    customerName: 'ANA',
    invoiceNumber: '001',
    saleDate: '2026-11-14',
    deliveryDate: '2026-11-14',
    voided: false,
    lines: [{ productId: 'p1', productName: 'SODA', quantity: 1, unitValue: 1000, totalValue: 1000 }],
    subtotal: 1000,
    total: 1000
  });
  assert.equal(toInvoiceSummaries([{ saleId: 's1', deliveryDate: '2026-11-14', customerId: 'c1', invoiceNumber: '001', status: 'VOIDED', totalAmount: 1 }])[0].status, 'VOIDED');
  assert.throws(() => toInvoiceSummaries({}), InvoiceInvalidError);
  assert.equal(toLoadSheetLines({ lines: [{ productId: 'p1', name: 'SODA', quantity: 1, brand: 'ACME', wholesaleCost: 1, wholesaleSalePrice: 2, totalPrice: 2, profit: 1, priceGroups: [] }] }).length, 1);
  assert.throws(() => toLoadSheetLines(null), LoadSheetInvalidError);
  const printed: string[] = [];
  const frame = document.createElement('iframe');
  Object.defineProperty(frame, 'contentWindow', {
    configurable: true,
    value: {
      document: { open() {}, write(html: string) { printed.push(html); }, close() {}, images: [] },
      focus() {},
      print() {},
      addEventListener() {}
    }
  });
  const original = document.createElement.bind(document);
  document.createElement = ((tag: string) => (tag === 'iframe' ? frame : original(tag))) as typeof document.createElement;
  new BrowserInvoicePrint().print([invoice as InvoiceDocumentModel]);
  document.createElement = original;
  assert.equal(printed.length, 1);
});

test('catalog, customer, and invoice HTTP adapters map a saved record and a rejected one', async () => {
  const records = {
    get: async () => ({ success: true, data: { items: [productShape()], total: 1, page: 1, pageSize: 10 } }),
    post: async () => ({ success: true, data: productShape() }),
    put: async () => ({ success: true, data: productShape() }),
    patch: async () => ({}),
    delete: async () => ({}),
    url: (path: string) => path
  };
  const catalog = new HttpCatalogProduct(records);
  assert.equal((await catalog.list(1, 10, 'SODA')).items[0].code, 'ACM001');
  assert.equal((await catalog.update('p1', { name: 'SODA' })).id, 'p1');
  assert.equal((await catalog.create({ name: 'SODA', wholesaleCost: 1, wholesalePrice: 2, retailCost: 1, retailPrice: 2, units: 1, pack: 1 })).code, 'ACM001');
  const rejected = new HttpCatalogProduct({
    ...client(null),
    post: async () => {
      throw new HttpRequestError(400, 'no', 'PRODUCT_INVALID');
    }
  });
  await assert.rejects(() => rejected.create({ name: 'SODA', wholesaleCost: 1, wholesalePrice: 2, retailCost: 1, retailPrice: 2, units: 1, pack: 1 }), CatalogInvalidError);

  const customers = new HttpCustomerCommand(client({ success: true, data: { id: 'c1', documentType: 'CC', documentNumber: '1', name: 'ANA', phone: '300', email: 'a@b.co', address: 'Calle 1' } }));
  assert.equal((await customers.create({ documentType: 'CC', documentNumber: '1', name: 'ANA', phone: '300', email: 'a@b.co', address: 'Calle 1' })).name, 'ANA');
  const duplicate = new HttpCustomerCommand({
    ...client(null),
    post: async () => {
      throw new HttpRequestError(409, 'no', 'CUSTOMER_ALREADY_EXISTS');
    }
  });
  await assert.rejects(() => duplicate.create({ documentType: 'CC', documentNumber: '1', name: 'ANA', phone: '', email: '', address: '' }), CustomerAlreadyExistsError);

  const invoices = new HttpInvoiceQuery({
    ...client(null),
    get: async () => ({ success: true, data: [{ saleId: 's1', deliveryDate: '2026-11-14', customerId: 'c1', invoiceNumber: '001', status: 'CONFIRMED', totalAmount: 1 }] })
  });
  assert.equal((await invoices.list('2026-11-14')).length, 1);
  const blocked = new HttpInvoiceQuery({
    ...client(null),
    get: async () => {
      throw new HttpRequestError(409, 'no', 'SALE_NOT_INVOICEABLE');
    }
  });
  await assert.rejects(() => blocked.get('s1'), InvoiceNotPrintableError);
});

function productShape() {
  return { id: 'p1', code: 'ACM001', name: 'SODA', brandName: 'ACME', units: 1, pack: 1, wholesaleCost: 1, wholesalePrice: 2, retailCost: 1, retailPrice: 2 };
}
