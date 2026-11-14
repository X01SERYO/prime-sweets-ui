import assert from 'node:assert/strict';
import { fireEvent, render, screen } from '@testing-library/react';
import { test } from 'vitest';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { CreateDraftSaleUseCase } from '../../modules/sales/application/use-cases/createDraftSale.useCase.ts';
import { UpdateSaleItemNameUseCase } from '../../modules/sales/application/use-cases/updateSaleItemName.useCase.ts';
import { SearchCustomersUseCase } from '../../modules/customers/application/use-cases/searchCustomers.useCase.ts';
import { ListInvoicesUseCase } from '../../modules/fulfillment-output/application/use-cases/listInvoices.useCase.ts';
import { toSale } from '../../modules/sales/adapters/infrastructure/saleMapper.ts';
import { loadSheetErrorKey } from '../../modules/fulfillment-output/adapters/ui/hooks/loadSheetErrorKey.ts';
import { LoadSheetInvalidError } from '../../modules/fulfillment-output/domain/errors/loadSheetInvalid.error.ts';
import { HttpAuth } from '../../modules/identity/adapters/infrastructure/httpAuth.ts';
import { CompanyProfileNotConfiguredError } from '../../modules/fulfillment-output/domain/errors/companyProfileNotConfigured.error.ts';
import { HttpBrand } from '../../modules/catalog/adapters/infrastructure/httpBrand.ts';
import { CatalogInvalidError } from '../../modules/catalog/domain/errors/catalogInvalid.error.ts';
import { useProductSearch } from '../../modules/catalog/adapters/ui/hooks/useProductSearch.ts';
import { HttpCustomerQuery } from '../../modules/customers/adapters/infrastructure/httpCustomerQuery.ts';
import { customerErrorKey } from '../../modules/customers/adapters/ui/hooks/customerErrorKey.ts';
import { useCustomerSearch } from '../../modules/customers/adapters/ui/hooks/useCustomerSearch.ts';
import { CustomerAlreadyExistsError } from '../../modules/customers/domain/errors/customerAlreadyExists.error.ts';
import { CustomerInvalidError } from '../../modules/customers/domain/errors/customerInvalid.error.ts';
import { CustomerNotFoundError } from '../../modules/customers/domain/errors/customerNotFound.error.ts';
import { toInvoiceDocument, toInvoiceSummaries } from '../../modules/fulfillment-output/adapters/infrastructure/invoiceMapper.ts';
import { HttpInvoiceQuery } from '../../modules/fulfillment-output/adapters/infrastructure/httpInvoiceQuery.ts';
import { InvoiceInvalidError } from '../../modules/fulfillment-output/domain/errors/invoiceInvalid.error.ts';
import { BrowserInvoicePrint } from '../../modules/fulfillment-output/adapters/infrastructure/browserInvoicePrint.ts';
import { HttpSale } from '../../modules/sales/adapters/infrastructure/httpSale.ts';
import { SaleInvalidError } from '../../modules/sales/domain/errors/saleInvalid.error.ts';
import { parseQuantity, QuantityField } from '../../modules/sales/adapters/ui/views/QuantityField.tsx';
import { HttpLoadSheetQuery } from '../../modules/fulfillment-output/adapters/infrastructure/httpLoadSheetQuery.ts';
import { LoadSheetNotClosedError } from '../../modules/fulfillment-output/domain/errors/loadSheetNotClosed.error.ts';
import { useInvoiceDocument } from '../../modules/fulfillment-output/adapters/ui/hooks/useInvoiceDocument.ts';
import { useSaleCustomer } from '../../modules/customers/adapters/ui/hooks/useSaleCustomer.ts';
import { useDeliverySales } from '../../modules/sales/adapters/ui/hooks/useDeliverySales.ts';
import { useLogin } from '../../modules/identity/adapters/ui/hooks/useLogin.ts';
import { InvalidCredentialsError } from '../../modules/identity/domain/errors/invalidCredentials.error.ts';
import { LoginResponseInvalidError } from '../../modules/identity/domain/errors/loginResponseInvalid.error.ts';
import { ScreenTitle } from '../../shared/ui/BackButton.tsx';
import { LocaleProvider } from '../../shared/i18n/locale.tsx';
import { HttpRequestError, type HttpClient } from '../../shared/infrastructure/http/httpClient.ts';
import type { InvoiceDocumentModel } from '../../modules/fulfillment-output/domain/models/invoiceSummary.ts';

function http(result: unknown): HttpClient {
  const ok = async () => result;
  return { get: ok, post: ok, put: ok, patch: ok, delete: ok, url: path => path };
}

test('brands, customers, invoices, and sales reject a broken payload', async () => {
  const brands = new HttpBrand(http({ success: true, data: [{ id: 'b1', name: 'ACME', code: 'ACM' }] }));
  assert.equal((await brands.list())[0].code, 'ACM');
  const created = new HttpBrand(http({ success: true, data: { id: 'b2', name: 'NUEVA', code: 'NUE' } }));
  assert.equal((await created.create({ name: 'NUEVA', code: 'NUE' })).id, 'b2');
  await assert.rejects(() => new HttpBrand(http({ success: false })).list(), CatalogInvalidError);

  const people = new HttpCustomerQuery(http({ success: true, data: [{ id: 'c1', documentType: 'CC', documentNumber: '1', name: 'ANA', phone: '', email: '', address: '' }] }));
  assert.equal((await people.search('ANA'))[0].name, 'ANA');
  const missing = new HttpCustomerQuery({
    ...http(null),
    get: async () => {
      throw new HttpRequestError(404, 'no');
    }
  });
  await assert.rejects(() => missing.get('c1'), CustomerNotFoundError);
  await assert.rejects(() => new HttpCustomerQuery(http({ success: false })).search('ANA'), CustomerInvalidError);

  assert.equal(customerErrorKey(new CustomerAlreadyExistsError(), 'customerInvalid'), 'customerAlreadyExists');
  assert.equal(customerErrorKey(new CustomerNotFoundError(), 'customerInvalid'), 'customerNotFound');
  assert.equal(customerErrorKey(new CustomerInvalidError(), 'customerInvalid'), 'customerInvalid');
  assert.equal(customerErrorKey(new Error('x'), 'customerCreateFailed'), 'customerCreateFailed');

  assert.equal(toInvoiceSummaries([{ saleId: 's1', deliveryDate: '2026-11-14', customerId: 'c1', invoiceNumber: '001', status: 'CONFIRMED', totalAmount: '10' }])[0].totalAmount, 10);
  assert.throws(() => toInvoiceSummaries([{ status: 'DRAFT' }]), InvoiceInvalidError);
  assert.throws(() => toInvoiceDocument({ lines: 'no' }), InvoiceInvalidError);

  const boom = http(null);
  const fail = async () => {
    throw new Error('down');
  };
  const broken = new HttpSale({ ...boom, post: fail, put: fail, patch: fail, delete: fail, get: async () => ({ success: false }) });
  await assert.rejects(() => broken.addItem('s1', 'p1', 1, 'SODA'), Error);
  await assert.rejects(() => broken.updateQuantity('s1', 'i1', 1), Error);
  await assert.rejects(() => broken.updateName('s1', 'i1', 'SODA'), Error);
  await assert.rejects(() => broken.removeItem('s1', 'i1'), Error);
  await assert.rejects(() => broken.setDeliveryDate('s1', '2026-11-15'), Error);
  await assert.rejects(() => broken.confirm('s1'), Error);
  await assert.rejects(() => broken.void('s1'), Error);
  await assert.rejects(() => broken.listByDeliveryDate('2026-11-14'), SaleInvalidError);
  const sheets = new HttpLoadSheetQuery({
    ...http(null),
    get: async () => {
      throw new HttpRequestError(409, 'open', 'SALES_DAY_NOT_CLOSED');
    }
  });
  await assert.rejects(() => sheets.getByDeliveryDate('2026-11-14'), LoadSheetNotClosedError);

  assert.throws(() => toSale({ id: 's', customerId: 'c', status: 'DRAFT', items: [null] }), SaleInvalidError);
  assert.equal(toSale({
    id: 's',
    customerId: 'c',
    status: 'VOIDED',
    totalAmount: 5,
    totalProfit: 1,
    totalQuantity: 1,
    items: [{ id: 'i', productId: 'p', itemName: 'SODA', quantity: 1, wholesalePrice: '5', totalPrice: 5 }]
  }).items[0].wholesalePrice, 5);
  assert.equal(loadSheetErrorKey(new LoadSheetNotClosedError(), 'loadSheetInvalid'), 'loadSheetNotClosed');
  assert.equal(loadSheetErrorKey(new LoadSheetInvalidError(), 'loadSheetInvalid'), 'loadSheetInvalid');
  assert.equal(loadSheetErrorKey(new Error('x'), 'loadSheetInvalid'), 'loadSheetInvalid');
  await assert.rejects(() => new HttpInvoiceQuery(http({ success: false })).list('2026-11-14'), InvoiceInvalidError);
  await assert.rejects(() => new HttpInvoiceQuery({
    ...http(null),
    get: async () => {
      throw new HttpRequestError(409, 'no', 'COMPANY_PROFILE_NOT_CONFIGURED');
    }
  }).get('s1'), CompanyProfileNotConfiguredError);
  await assert.rejects(() => new HttpAuth(http({ success: true, data: { token: 1 } })).login({ email: 'a@b.co', password: 'x' }), LoginResponseInvalidError);
  assert.throws(() => toInvoiceSummaries([null]), InvoiceInvalidError);
  const drafts = new CreateDraftSaleUseCase({ create: async () => ({ id: 's1' }) } as never);
  await assert.rejects(() => drafts.execute(' ', ' '), SaleInvalidError);
  assert.equal((await drafts.execute(' c ', ' 2026-11-14 ')).id, 's1');
  const names = new UpdateSaleItemNameUseCase({ updateName: async () => ({ id: 's1' }) } as never);
  await assert.rejects(() => names.execute('s1', 'i1', ' '), SaleInvalidError);
  assert.equal((await names.execute('s1', 'i1', ' SODA ')).id, 's1');
  const customers = new SearchCustomersUseCase({ search: async () => [{ id: 'c1' }] } as never);
  assert.equal((await customers.execute(' ')).length, 0);
  assert.equal((await customers.execute(' ANA ')).length, 1);
  const invoices = new ListInvoicesUseCase({ list: async () => [{ saleId: 's1' }] } as never);
  await assert.rejects(() => invoices.execute(' '), InvoiceInvalidError);
  assert.equal((await invoices.execute(' 2026-11-14 ')).length, 1);
  assert.equal(parseQuantity('1,5'), 1.5);
  assert.equal(parseQuantity('0'), null);
  assert.equal(parseQuantity('1.0001'), null);
});

test('a ticket with a bad date and a missing frame does not throw', () => {
  const frame = document.createElement('iframe');
  Object.defineProperty(frame, 'contentWindow', { configurable: true, value: null });
  const original = document.createElement.bind(document);
  document.createElement = ((tag: string) => (tag === 'iframe' ? frame : original(tag))) as typeof document.createElement;
  const ticket: InvoiceDocumentModel = {
    companyName: 'A & B',
    companyNit: '1',
    city: 'Bogota',
    country: 'CO',
    telephone: '1',
    logo: '',
    taxRegime: 'simple',
    legalText: 'Gracias',
    customerDocumentType: 'CC',
    customerDocumentNumber: '1',
    customerName: 'ANA',
    invoiceNumber: '001',
    saleDate: 'no-es-fecha',
    deliveryDate: 'ayer',
    voided: true,
    lines: [{ productId: 'p1', productName: 'SODA <roja>', quantity: 1, unitValue: 1, totalValue: 1 }],
    subtotal: 1,
    total: 1
  };
  new BrowserInvoicePrint().print([ticket]);
  const image = { complete: false, onload: () => undefined, onerror: () => undefined };
  const written: string[] = [];
  const live = document.createElement('iframe');
  Object.defineProperty(live, 'contentWindow', {
    configurable: true,
    value: {
      document: { open() {}, write(html: string) { written.push(html); }, close() {}, images: [image] },
      focus() {},
      print() {},
      addEventListener() {}
    }
  });
  document.createElement = ((tag: string) => (tag === 'iframe' ? live : original(tag))) as typeof document.createElement;
  new BrowserInvoicePrint().print([ticket]);
  image.onload();
  document.createElement = original;
  assert.equal(written.length, 1);
});

function SearchProbe() {
  const search = useProductSearch({
    execute: async () => {
      throw new CatalogInvalidError();
    }
  });
  const customers = useCustomerSearch({
    execute: async () => {
      throw new CustomerInvalidError();
    }
  });
  const customer = useSaleCustomer('c1', { execute: async () => { throw new CustomerNotFoundError(); } });
  const invoice = useInvoiceDocument('s1', { execute: async () => { throw new InvoiceInvalidError(); } });
  const deliveries = useDeliverySales('2026-11-14', { execute: async () => { throw new Error('no'); } });
  const login = useLogin(
    {
      execute: async () => {
        throw new InvalidCredentialsError();
      }
    },
    () => undefined
  );
  const brokenLogin = useLogin(
    {
      execute: async () => {
        throw new LoginResponseInvalidError();
      }
    },
    () => undefined
  );
  return (
    <div>
      <button type="button" onClick={() => void search.submit()}>short</button>
      <button type="button" onClick={() => { search.setQuery('SODA'); }}>type</button>
      <button type="button" onClick={() => void search.submit()}>go</button>
      <button type="button" onClick={() => search.resetQuery()}>reset</button>
      <button type="button" onClick={() => void customers.submit()}>customers</button>
      <button type="button" onClick={() => { login.setEmail('a@b.co'); login.setPassword('x'); void login.submit(); }}>bad-login</button>
      <button type="button" onClick={() => { brokenLogin.setEmail('a@b.co'); brokenLogin.setPassword('x'); void brokenLogin.submit(); }}>broken-login</button>
      <button type="button" onClick={() => void login.submit()}>empty-login</button>
      <span>{customer.error}{invoice.error}{deliveries.error}{invoice.loading ? '1' : '0'}</span>
      <QuantityField value="2" onChange={() => undefined} />
    </div>
  );
}

test('search, login, and the back link cover their failure branches', () => {
  const router = createMemoryRouter(
    [{ path: '*', element: <LocaleProvider><ScreenTitle>Productos</ScreenTitle><SearchProbe /></LocaleProvider> }],
    { initialEntries: ['/products'] }
  );
  render(<RouterProvider router={router} />);
  fireEvent.click(screen.getByRole('button', { name: 'short' }));
  fireEvent.click(screen.getByRole('button', { name: 'type' }));
  fireEvent.click(screen.getByRole('button', { name: 'go' }));
  fireEvent.click(screen.getByRole('button', { name: 'reset' }));
  fireEvent.click(screen.getByRole('button', { name: 'customers' }));
  fireEvent.click(screen.getByRole('button', { name: 'bad-login' }));
  fireEvent.click(screen.getByRole('button', { name: 'broken-login' }));
  fireEvent.click(screen.getByRole('button', { name: 'empty-login' }));
  fireEvent.click(screen.getByRole('button', { name: 'Disminuir cantidad' }));
  fireEvent.click(screen.getByRole('button', { name: 'Aumentar cantidad' }));
  fireEvent.click(screen.getByRole('button', { name: 'Volver' }));
});
