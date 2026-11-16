import assert from 'node:assert/strict';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, test } from 'vitest';
import { MemoryRouter } from 'react-router';
import { HttpRetailDay } from '@/modules/retail-sales/adapters/infrastructure/httpRetailDay';
import { HttpRetailProductSearch } from '@/modules/retail-sales/adapters/infrastructure/httpRetailProductSearch';
import { toRetailDay, toRetailDayPage, toRetailProductOption } from '@/modules/retail-sales/adapters/infrastructure/retailDayMapper';
import { retailErrorKey } from '@/modules/retail-sales/adapters/ui/hooks/retailErrorKey';
import { RetailHistoryView } from '@/modules/retail-sales/adapters/ui/views/RetailHistoryView';
import { RetailTodayView } from '@/modules/retail-sales/adapters/ui/views/RetailTodayView';
import type { RetailDayPort } from '@/modules/retail-sales/application/ports/retailDay.port';
import { AddRetailItemUseCase } from '@/modules/retail-sales/application/use-cases/addRetailItem.useCase';
import { GetTodayRetailDayUseCase } from '@/modules/retail-sales/application/use-cases/getTodayRetailDay.useCase';
import { ListRetailDaysUseCase } from '@/modules/retail-sales/application/use-cases/listRetailDays.useCase';
import { RemoveRetailItemUseCase } from '@/modules/retail-sales/application/use-cases/removeRetailItem.useCase';
import { ReviewRetailDaysUseCase } from '@/modules/retail-sales/application/use-cases/reviewRetailDays.useCase';
import { SearchRetailProductsUseCase } from '@/modules/retail-sales/application/use-cases/searchRetailProducts.useCase';
import { SetRetailItemQuantityUseCase } from '@/modules/retail-sales/application/use-cases/setRetailItemQuantity.useCase';
import { RetailInvalidError } from '@/modules/retail-sales/domain/errors/retailInvalid.error';
import type { RetailDayModel, RetailDayPage } from '@/modules/retail-sales/domain/models/retailDay';
import { parseRetailQuantity } from '@/modules/retail-sales/domain/quantity';
import { LocaleProvider } from '@/shared/i18n/locale';
import { HttpRequestError, type HttpClient } from '@/shared/infrastructure/http/httpClient';

const day: RetailDayModel = {
  id: 'd1',
  businessDate: '2026-11-14',
  editable: true,
  status: 'UNREVIEWED',
  reviewedAt: null,
  reviewedByName: null,
  totalAmount: 1000,
  totalProfit: 200,
  items: [
    {
      productId: 'p1',
      productCode: 'A1',
      brandName: 'ACME',
      productName: 'SODA',
      retailPrice: 500,
      quantity: 2,
      totalPrice: 1000,
      profit: 200,
      hasCost: false
    }
  ]
};

const page: RetailDayPage = {
  items: [
    {
      businessDate: '2026-11-14',
      status: 'UNREVIEWED',
      totalAmount: 1000,
      totalProfit: 200,
      reviewedAt: null,
      reviewedByName: null
    }
  ],
  total: 1,
  page: 1,
  pageSize: 10
};

function http(result: unknown, fail = false): HttpClient {
  const run = async () => {
    if (fail) {
      throw new HttpRequestError(409, 'closed', 'RETAIL_DAY_CLOSED');
    }
    return result;
  };
  return { get: run, post: run, put: run, patch: run, delete: run, url: path => path };
}

class MemoryRetail implements RetailDayPort {
  async getToday() {
    return day;
  }
  async addItem() {
    return day;
  }
  async setQuantity() {
    return day;
  }
  async removeItem() {
    return { ...day, items: [] };
  }
  async list() {
    return page;
  }
  async review() {}
}

afterEach(() => cleanup());

test('retail quantity, mapping, and http reject bad values and map a day', async () => {
  assert.equal(parseRetailQuantity('2'), 2);
  assert.equal(parseRetailQuantity('0'), null);
  assert.equal(parseRetailQuantity('1.5'), null);
  assert.equal(toRetailDay(day).items[0].hasCost, false);
  assert.throws(() => toRetailDay(null), RetailInvalidError);
  assert.throws(() => toRetailDay({ ...day, items: [{}] }), RetailInvalidError);
  assert.equal(toRetailDayPage(page).total, 1);
  assert.throws(() => toRetailDayPage({ items: [] }), RetailInvalidError);
  assert.equal(toRetailProductOption({ id: 'p1', code: 'A1', retailPrice: 10, retailCost: 0 }).hasCost, false);
  assert.throws(() => toRetailProductOption(null), RetailInvalidError);

  const client = new HttpRetailDay(http({ success: true, data: day }));
  assert.equal((await client.getToday()).id, 'd1');
  assert.equal((await client.addItem('p1', 1)).totalAmount, 1000);
  assert.equal((await client.setQuantity('p1', 2)).items[0].quantity, 2);
  assert.equal((await client.removeItem('p1')).id, 'd1');
  const listed = new HttpRetailDay(http({ success: true, data: page }));
  assert.equal((await listed.list('UNREVIEWED', 1, 10)).items.length, 1);
  await listed.review(['2026-11-14']);
  await assert.rejects(() => new HttpRetailDay(http(null, true)).getToday(), RetailInvalidError);
  await assert.rejects(() => new HttpRetailDay(http({ success: false })).addItem('p1', 1), RetailInvalidError);
  const search = new HttpRetailProductSearch(http({ success: true, data: [{ id: 'p1', code: 'A1', retailPrice: 10, retailCost: 4 }] }));
  assert.equal((await search.search('sod'))[0].hasCost, true);
  await assert.rejects(() => new HttpRetailProductSearch(http({ success: false })).search('sod'), RetailInvalidError);

  const memory = new MemoryRetail();
  assert.equal(await new GetTodayRetailDayUseCase(memory).execute(), day);
  await assert.rejects(() => new AddRetailItemUseCase(memory).execute('', 1), RetailInvalidError);
  await assert.rejects(() => new SetRetailItemQuantityUseCase(memory).execute('p1', 0), RetailInvalidError);
  await assert.rejects(() => new RemoveRetailItemUseCase(memory).execute(' '), RetailInvalidError);
  await assert.rejects(() => new ReviewRetailDaysUseCase(memory).execute([]), RetailInvalidError);
  assert.equal((await new SearchRetailProductsUseCase({ search: async () => [] }).execute('a')).length, 0);
  assert.equal(retailErrorKey(new RetailInvalidError('PRODUCT_WITHOUT_RETAIL_PRICE')), 'retailNoPrice');
  assert.equal(retailErrorKey(new Error('x')), 'retailSaveFailed');
});

test('today retail screen adds, changes, and removes a product', async () => {
  const memory = new MemoryRetail();
  render(
    <LocaleProvider>
      <RetailTodayView
        getToday={new GetTodayRetailDayUseCase(memory)}
        searchProducts={new SearchRetailProductsUseCase({
          search: async query => {
            if (query === 'bad') {
              throw new RetailInvalidError();
            }
            if (query === 'sin') {
              return [{ id: 'p3', code: 'C3', brandName: 'JET', name: 'SIN', retailPrice: null, hasCost: false }];
            }
            if (query === 'vac') {
              return [];
            }
            return [{ id: 'p2', code: 'B2', brandName: 'JET', name: 'CHOC', retailPrice: 1500, hasCost: true }];
          }
        })}
        addItem={new AddRetailItemUseCase(memory)}
        setQuantity={new SetRetailItemQuantityUseCase(memory)}
        removeItem={new RemoveRetailItemUseCase(memory)}
      />
    </LocaleProvider>
  );
  await screen.findByText('SODA');
  const search = screen.getByRole('combobox');
  fireEvent.change(search, { target: { value: 'ab' } });
  fireEvent.submit(search.closest('form')!);
  await screen.findByText(/al menos 3/);
  fireEvent.change(search, { target: { value: 'bad' } });
  fireEvent.click(screen.getByRole('button', { name: 'Buscar' }));
  await screen.findByText(/no se pudo cargar la venta de hoy/i);
  fireEvent.change(search, { target: { value: 'vac' } });
  fireEvent.click(screen.getByRole('button', { name: 'Buscar' }));
  await screen.findByText(/ningún producto/i);
  fireEvent.change(search, { target: { value: 'sin' } });
  fireEvent.keyDown(search, { key: 'Enter' });
  fireEvent.click(await screen.findByRole('button', { name: /SIN/ }));
  fireEvent.change(search, { target: { value: 'cho' } });
  fireEvent.keyDown(search, { key: 'ArrowDown' });
  fireEvent.keyDown(search, { key: 'ArrowUp' });
  fireEvent.keyDown(search, { key: 'Escape' });
  fireEvent.keyDown(search, { key: 'Enter' });
  fireEvent.click(await screen.findByRole('button', { name: /CHOC/ }));
  fireEvent.click(screen.getByRole('button', { name: '+ Agregar' }));
  const quantities = screen.getAllByLabelText('Cantidad');
  fireEvent.change(quantities[1], { target: { value: 'x' } });
  fireEvent.blur(quantities[1]);
  fireEvent.change(quantities[1], { target: { value: '4' } });
  fireEvent.keyDown(quantities[1], { key: 'Enter' });
  fireEvent.click(screen.getAllByRole('button', { name: 'Disminuir cantidad' })[1]);
  fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }));
  await screen.findByText('SODA');
});

test('retail screens show a closed day and a failed load', async () => {
  const closed: RetailDayModel = {
    ...day,
    editable: false,
    status: 'REVIEWED',
    reviewedAt: '2026-11-14T12:00:00Z',
    reviewedByName: 'Ana'
  };
  const closedPort = new MemoryRetail();
  closedPort.getToday = async () => closed;
  render(
    <LocaleProvider>
      <RetailTodayView
        getToday={new GetTodayRetailDayUseCase(closedPort)}
        searchProducts={new SearchRetailProductsUseCase({ search: async () => [] })}
        addItem={new AddRetailItemUseCase(closedPort)}
        setQuantity={new SetRetailItemQuantityUseCase(closedPort)}
        removeItem={new RemoveRetailItemUseCase(closedPort)}
      />
    </LocaleProvider>
  );
  await screen.findByText('Revisado por');
  await screen.findByText('Ana');
  cleanup();

  const failing = new MemoryRetail();
  failing.getToday = async () => {
    throw new RetailInvalidError('RETAIL_DAY_CLOSED');
  };
  failing.list = async () => {
    throw new RetailInvalidError('RETAIL_DAY_ALREADY_REVIEWED');
  };
  render(
    <LocaleProvider>
      <RetailTodayView
        getToday={new GetTodayRetailDayUseCase(failing)}
        searchProducts={new SearchRetailProductsUseCase({ search: async () => [] })}
        addItem={new AddRetailItemUseCase(failing)}
        setQuantity={new SetRetailItemQuantityUseCase(failing)}
        removeItem={new RemoveRetailItemUseCase(failing)}
      />
    </LocaleProvider>
  );
  await screen.findByText(/no se pudo cargar la venta de hoy/i);
  cleanup();

  render(
    <MemoryRouter>
      <LocaleProvider>
        <RetailHistoryView listDays={new ListRetailDaysUseCase(failing)} reviewDays={new ReviewRetailDaysUseCase(failing)} />
      </LocaleProvider>
    </MemoryRouter>
  );
  await screen.findByText(/no se pudo cargar los días/i);
});

test('retail history selects a day and confirms the review', async () => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function close() {
    this.open = false;
  };
  const memory = new MemoryRetail();
  render(
    <MemoryRouter>
      <LocaleProvider>
        <RetailHistoryView listDays={new ListRetailDaysUseCase(memory)} reviewDays={new ReviewRetailDaysUseCase(memory)} />
      </LocaleProvider>
    </MemoryRouter>
  );
  await screen.findByText(/sin revisar/i);
  fireEvent.click(screen.getByRole('checkbox', { name: /seleccionar página/i }));
  fireEvent.click(screen.getByRole('button', { name: /confirmar revisión/i }));
  fireEvent.click(screen.getByRole('button', { name: 'Confirmar revisión' }));
  await screen.findByText(/días revisados/);
  fireEvent.click(screen.getByRole('tab', { name: 'Revisado' }));
  fireEvent.change(screen.getByLabelText('Por página'), { target: { value: '20' } });
});

test('retail review reports a day that was already reviewed', async () => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.open = true;
  };
  const memory = new MemoryRetail();
  memory.review = async () => {
    throw new RetailInvalidError('RETAIL_DAY_ALREADY_REVIEWED');
  };
  render(
    <MemoryRouter>
      <LocaleProvider>
        <RetailHistoryView listDays={new ListRetailDaysUseCase(memory)} reviewDays={new ReviewRetailDaysUseCase(memory)} />
      </LocaleProvider>
    </MemoryRouter>
  );
  await screen.findByText(/seleccionar página/i);
  fireEvent.click(screen.getByRole('checkbox', { name: /seleccionar página/i }));
  fireEvent.click(screen.getByRole('button', { name: /confirmar revisión/i }));
  fireEvent.click(screen.getByRole('button', { name: 'Confirmar revisión' }));
  await screen.findByText(/ya estaba revisado/i);
});
