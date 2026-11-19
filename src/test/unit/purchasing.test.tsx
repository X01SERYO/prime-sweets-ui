import assert from 'node:assert/strict';
import type { ReactNode } from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { test } from 'vitest';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { HttpPurchasing } from '../../modules/purchasing/adapters/infrastructure/httpPurchasing.ts';
import {
  toPurchaseOrder,
  toPurchaseOrderPage,
  toSupplierList,
  toSupplierSheet
} from '../../modules/purchasing/adapters/infrastructure/purchasingMapper.ts';
import { PurchaseOrderSheetView } from '../../modules/purchasing/adapters/ui/views/PurchaseOrderSheetView.tsx';
import { PurchaseOrderView } from '../../modules/purchasing/adapters/ui/views/PurchaseOrderView.tsx';
import { SupplierDetailView } from '../../modules/purchasing/adapters/ui/views/SupplierDetailView.tsx';
import { SupplierListView } from '../../modules/purchasing/adapters/ui/views/SupplierListView.tsx';
import {
  CreatePurchaseOrderUseCase,
  CreateSupplierUseCase,
  GetPurchaseOrderUseCase,
  GetSupplierUseCase,
  ListPurchaseOrdersUseCase,
  ListSuppliersUseCase,
  RenameSupplierUseCase,
  SetSupplierProductsUseCase,
  UpdatePurchaseOrderUseCase
} from '../../modules/purchasing/application/use-cases/purchasing.useCases.ts';
import { PurchaseInvalidError } from '../../modules/purchasing/domain/errors/purchaseInvalid.error.ts';
import { lineCost, orderTotal } from '../../modules/purchasing/domain/lineCost.ts';
import type { PurchasingPort } from '../../modules/purchasing/application/ports/purchasing.port.ts';
import { HttpRequestError, type HttpClient } from '../../shared/infrastructure/http/httpClient.ts';
import { LocaleProvider } from '../../shared/i18n/locale.tsx';

const sheet = {
  id: 'sup-1',
  name: 'Andina',
  products: [
    {
      productId: 'p1',
      productCode: 'COL007',
      brandName: 'COLOMBINA',
      productName: 'CHOCO',
      unitCost: 1000,
      previousQuantity: 2,
      lastQuantity: 4,
      lastItemName: 'CHOCO fresa',
      items: []
    }
  ]
};

const order = {
  id: 'ord-1',
  supplierId: 'sup-1',
  lineCount: 1,
  totalCost: 4000,
  createdAt: '2026-11-15T12:00:00.000Z',
  hasLines: true,
  lines: [
    {
      productId: 'p1',
      productCode: 'COL007',
      brandName: 'COLOMBINA',
      catalogName: 'CHOCO',
      itemName: 'CHOCO fresa',
      unitCost: 1000,
      quantity: 4
    }
  ]
};

function show(element: ReactNode) {
  cleanup();
  const router = createMemoryRouter([{ path: '*', element: <LocaleProvider>{element}</LocaleProvider> }], {
    initialEntries: ['/purchasing']
  });
  render(<RouterProvider router={router} />);
}

test('purchase mappers accept a sheet and reject a broken payload', () => {
  assert.equal(lineCost(10.5, 2), 21);
  assert.equal(orderTotal([{ unitCost: 10.5, quantity: 2 }]), 21);
  assert.equal(new PurchaseInvalidError('X').code, 'X');
  const listed = toSupplierList([{ id: 'a', name: 'A', productCount: 2, latestOrderId: 'o' }, { id: 1 }]);
  assert.equal(listed[0].latestOrderId, 'o');
  assert.equal(listed[1].latestOrderId, null);
  const mapped = toSupplierSheet(sheet);
  assert.equal(mapped.products[0].lastItemName, 'CHOCO fresa');
  assert.equal(toSupplierSheet({ id: 'a', name: 'A' }).products.length, 0);
  assert.equal(toPurchaseOrder(order).lines[0].quantity, 4);
  assert.equal(toPurchaseOrder({ id: 'a', lines: null, hasLines: false }).hasLines, false);
  const page = toPurchaseOrderPage({
    total: 1,
    items: [{ id: 'o', supplierId: 's', supplierName: 'A', createdAt: '2026-11-15', lineCount: 1, totalCost: 10, hasLines: true }]
  });
  assert.equal(page.items[0].hasLines, true);
  assert.throws(() => toSupplierList({}), PurchaseInvalidError);
  assert.throws(() => toSupplierSheet(null), PurchaseInvalidError);
});

test('the purchasing client maps every call and turns a failed response into a purchase error', async () => {
  const calls: string[] = [];
  const http = {
    async get(path: string) {
      calls.push(path);
      if (path.startsWith('/purchase-orders?')) return { success: true, data: { items: [] } };
      if (path.startsWith('/purchase-orders/')) return { success: true, data: order };
      if (path === '/suppliers') return { success: true, data: [{ id: 'sup-1', name: 'Andina', productCount: 1, latestOrderId: null }] };
      return { success: true, data: sheet };
    },
    async post(path: string) {
      calls.push(path);
      return { success: true, data: path === '/suppliers' ? sheet : order };
    },
    async put() {
      return { success: true, data: sheet };
    },
    async patch() {
      return { success: true, data: order };
    }
  } as HttpClient;
  const client = new HttpPurchasing(http);
  assert.equal((await client.listSuppliers())[0].name, 'Andina');
  assert.equal((await client.createSupplier('Andina')).id, 'sup-1');
  await client.renameSupplier('sup-1', 'Andina');
  assert.equal((await client.getSupplier('sup-1')).name, 'Andina');
  assert.equal((await client.setSupplierProducts('sup-1', ['p1'])).products.length, 1);
  assert.equal((await client.createPurchaseOrder('sup-1', [{ productId: 'p1', quantity: 1 }], [])).id, 'ord-1');
  assert.equal((await client.updatePurchaseOrder('ord-1', [{ productId: 'p1', quantity: 2 }], [])).id, 'ord-1');
  assert.equal((await client.listPurchaseOrders('sup-1', 1, 2)).items.length, 0);
  assert.equal((await client.getPurchaseOrder('ord-1')).lineCount, 1);
  assert.ok(calls.includes('/suppliers'));

  const denied = new HttpPurchasing({
    async get() {
      return { success: false, code: 'SUPPLIER_NOT_FOUND' };
    },
    async post() {
      throw new HttpRequestError(400, 'bad', 'PURCHASE_INVALID');
    },
    async put() {
      throw new Error('down');
    },
    async patch() {
      throw new PurchaseInvalidError('PURCHASE_ORDER_NOT_EDITABLE');
    }
  } as HttpClient);
  await assert.rejects(() => denied.listSuppliers(), (error: unknown) => error instanceof PurchaseInvalidError && error.code === 'SUPPLIER_NOT_FOUND');
  await assert.rejects(() => denied.createSupplier('A'), PurchaseInvalidError);
  await assert.rejects(() => denied.setSupplierProducts('sup-1', []), (error: unknown) => error instanceof Error && error.message === 'down');
  await assert.rejects(() => denied.renameSupplier('sup-1', 'B'), PurchaseInvalidError);

  const port: PurchasingPort = client;
  assert.equal((await new ListSuppliersUseCase(port).execute()).length, 1);
  assert.equal((await new CreateSupplierUseCase(port).execute('Andina')).name, 'Andina');
  await new RenameSupplierUseCase(port).execute('sup-1', 'Andina');
  assert.equal((await new GetSupplierUseCase(port).execute('sup-1')).id, 'sup-1');
  assert.equal((await new SetSupplierProductsUseCase(port).execute('sup-1', ['p1'])).products[0].productId, 'p1');
  assert.equal((await new CreatePurchaseOrderUseCase(port).execute('sup-1', [])).id, 'ord-1');
  assert.equal((await new UpdatePurchaseOrderUseCase(port).execute('ord-1', [])).id, 'ord-1');
  assert.equal((await new ListPurchaseOrdersUseCase(port).execute('sup-1', 1, 2)).page, 1);
  assert.equal((await new GetPurchaseOrderUseCase(port).execute('ord-1')).supplierId, 'sup-1');
});

test('the supplier list creates, renames, and reports a failed load', async () => {
  const items = [
    { id: 'sup-1', name: 'Andina', productCount: 1, latestOrderId: 'ord-1' },
    { id: 'sup-2', name: 'Norte', productCount: 0, latestOrderId: null }
  ];
  show(
    <SupplierListView
      listSuppliers={{ execute: async () => items }}
      createSupplier={{ execute: async (name: string) => ({ id: 'sup-3', name }) }}
      renameSupplier={{
        execute: async (_id: string, name: string) => {
          if (name.toLocaleUpperCase('es-CO') === 'MALO') throw new PurchaseInvalidError('SUPPLIER_NAME_TAKEN');
        }
      }}
    />
  );
  await screen.findByText('Andina');
  assert.ok(screen.getByRole('link', { name: 'Editar último pedido' }));
  assert.ok(screen.getByRole('button', { name: 'Editar último pedido' }).hasAttribute('disabled'));

  const rename = () => screen.getAllByRole('button', { name: /Editar proveedor|Guardar proveedor/ })[0];
  fireEvent.click(rename());
  fireEvent.keyDown(screen.getByDisplayValue('Andina'), { key: 'Escape' });
  fireEvent.click(rename());
  fireEvent.keyDown(screen.getByDisplayValue('Andina'), { key: 'Enter' });

  fireEvent.click(rename());
  fireEvent.change(screen.getByDisplayValue('Andina'), { target: { value: 'Andina Sur' } });
  fireEvent.click(rename());
  await screen.findByText('ANDINA SUR');

  fireEvent.click(rename());
  fireEvent.change(screen.getByDisplayValue('ANDINA SUR'), { target: { value: 'Malo' } });
  fireEvent.click(rename());
  await screen.findByText('SUPPLIER_NAME_TAKEN');

  fireEvent.click(screen.getByRole('button', { name: 'Nuevo proveedor' }));
  fireEvent.change(document.getElementById('supplier-name')!, { target: { value: 'Nuevo' } });
  fireEvent.click(screen.getByRole('button', { name: 'Crear proveedor' }));
  await waitFor(() => assert.equal((document.getElementById('supplier-name') as HTMLInputElement).value, 'NUEVO'));
});

test('a new order and the last order save the typed quantity', async () => {
  const search = {
    execute: async () => [{ id: 'p2', code: 'NUE001', name: 'GALLETA', wholesalePrice: 500, retailPrice: 700 }]
  };
  const products = { ...sheet, products: [...sheet.products] };
  show(
    <SupplierDetailView
      supplierId="sup-1"
      orderId={null}
      getSupplier={{ execute: async () => products }}
      setSupplierProducts={{
        execute: async (_id: string, productIds: string[]) => ({
          ...products,
          products: productIds.map(productId =>
            productId === 'p1'
              ? products.products[0]
              : {
                  productId,
                  productCode: 'NUE001',
                  brandName: 'ACME',
                  productName: 'GALLETA',
                  unitCost: null,
                  previousQuantity: null,
                  lastQuantity: null,
                  lastItemName: null,
                  items: []
                }
          )
        })
      }}
      searchProducts={search}
      listPurchaseOrders={{
        execute: async () => ({
          total: 2,
          page: 1,
          pageSize: 2,
          items: [
            { id: 'ord-1', supplierId: 'sup-1', supplierName: 'Andina', createdAt: '2026-11-15T12:00:00.000Z', lineCount: 1, totalCost: 4000, hasLines: true },
            { id: 'ord-0', supplierId: 'sup-1', supplierName: 'Andina', createdAt: 'not-a-date', lineCount: 1, totalCost: 1000, hasLines: false }
          ]
        })
      }}
      createPurchaseOrder={{ execute: async () => order }}
      updatePurchaseOrder={{ execute: async () => order }}
    />
  );
  await screen.findByText('CHOCO');
  fireEvent.change(screen.getByLabelText('Pedido nuevo'), { target: { value: '3a' } });
  fireEvent.click(screen.getByRole('button', { name: 'Guardar pedido' }));
  await screen.findByText('Pedido guardado');
});

test('editing the last order and a rejected save show the purchase error', async () => {
  show(
    <SupplierDetailView
      supplierId="sup-1"
      orderId="ord-1"
      getSupplier={{ execute: async () => sheet }}
      setSupplierProducts={{ execute: async () => sheet }}
      searchProducts={{ execute: async () => [] }}
      listPurchaseOrders={{ execute: async () => { throw new Error('down'); } }}
      createPurchaseOrder={{ execute: async () => order }}
      updatePurchaseOrder={{ execute: async () => { throw new PurchaseInvalidError('PURCHASE_ORDER_NOT_EDITABLE'); } }}
    />
  );
  await screen.findByDisplayValue('4');
  fireEvent.click(screen.getByRole('button', { name: 'Guardar pedido' }));
  await screen.findByText('PURCHASE_ORDER_NOT_EDITABLE');

  show(
    <SupplierDetailView
      supplierId="missing"
      orderId={null}
      getSupplier={{ execute: async () => { throw new Error('down'); } }}
      setSupplierProducts={{ execute: async () => sheet }}
      searchProducts={{ execute: async () => [] }}
      listPurchaseOrders={{ execute: async () => ({ total: 0, page: 1, pageSize: 2, items: [] }) }}
      createPurchaseOrder={{ execute: async () => order }}
      updatePurchaseOrder={{ execute: async () => order }}
    />
  );
  await screen.findByText('PURCHASE_FAILED');
});

test('the order sheet filters a line, saves it, and keeps a failed save on screen', async () => {
  let fail = false;
  let saved = 0;
  show(
    <PurchaseOrderSheetView
      supplierId="sup-1"
      getSupplier={{ execute: async () => sheet }}
      createPurchaseOrder={{
        execute: async () => {
          saved += 1;
          if (fail) throw new Error('down');
          return order;
        }
      }}
    />
  );
  await screen.findByLabelText('Cantidad');
  fireEvent.change(screen.getByLabelText('Filtrar por código, marca o nombre'), { target: { value: 'zzz' } });
  assert.equal(screen.queryByLabelText('Cantidad'), null);
  fireEvent.change(screen.getByLabelText('Filtrar por código, marca o nombre'), { target: { value: '' } });
  fireEvent.change(screen.getByLabelText('Producto'), { target: { value: 'CHOCO extra' } });
  fireEvent.change(screen.getByLabelText('Cantidad'), { target: { value: '2' } });
  fail = true;
  fireEvent.click(screen.getByRole('button', { name: 'Guardar pedido' }));
  await screen.findByText('No se pudo completar el pedido.');
  fail = false;
  fireEvent.click(screen.getByRole('button', { name: 'Guardar pedido' }));
  await waitFor(() => assert.equal(saved, 2));

  show(
    <PurchaseOrderSheetView
      supplierId="empty"
      getSupplier={{ execute: async () => ({ ...sheet, products: [] }) }}
      createPurchaseOrder={{ execute: async () => order }}
    />
  );
  await screen.findByText('Agrega los productos que le compras. El pedido se arma después.');

  show(
    <PurchaseOrderSheetView
      supplierId="bad"
      getSupplier={{ execute: async () => { throw new PurchaseInvalidError('SUPPLIER_NOT_FOUND'); } }}
      createPurchaseOrder={{ execute: async () => order }}
    />
  );
  await screen.findByText('SUPPLIER_NOT_FOUND');
});

test('an order detail shows its lines and a missing order', async () => {
  show(
    <PurchaseOrderView
      orderId="ord-1"
      getPurchaseOrder={{ execute: async () => order }}
    />
  );
  await screen.findByText('CHOCO fresa');

  show(
    <PurchaseOrderView
      orderId="missing"
      getPurchaseOrder={{ execute: async () => { throw new Error('down'); } }}
    />
  );
  await screen.findByText('No se pudo completar el pedido.');
});
