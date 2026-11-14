import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, test } from 'vitest';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { App } from '../../app/App.tsx';
import { createAppContainer } from '../../app/composition.ts';
import { LocaleProvider } from '../../shared/i18n/locale.tsx';

const product = {
  id: 'p1',
  code: 'ACM001',
  name: 'SODA',
  brandName: 'ACME',
  units: 1,
  pack: 1,
  wholesaleCost: 800,
  wholesalePrice: 1000,
  retailCost: 900,
  retailPrice: 1200
};

const customer = {
  id: 'c1',
  documentType: 'CC',
  documentNumber: '1',
  name: 'ANA',
  phone: '300',
  email: 'a@b.co',
  address: 'Calle 1'
};

const sale = {
  id: 's1',
  sellerId: 'u1',
  customerId: 'c1',
  status: 'DRAFT',
  captureDate: '2026-11-14',
  deliveryDate: '2026-11-14',
  invoiceNumber: '001',
  totalAmount: 2000,
  totalProfit: 400,
  totalQuantity: 2,
  createdAt: '2026-11-14T10:00:00Z',
  items: [
    {
      id: 'i1',
      productId: 'p1',
      productCode: 'ACM001',
      catalogName: 'SODA',
      itemName: 'SODA',
      quantity: 2,
      wholesalePrice: 1000,
      totalPrice: 2000
    }
  ]
};

function bodyFor(url: string, method: string): unknown {
  if (method !== 'GET' && url.includes('/products')) {
    return { success: true, data: product };
  }
  if (method !== 'GET' && url.includes('/customers')) {
    return { success: true, data: customer };
  }
  if (method !== 'GET' && url.includes('/brands')) {
    return { success: true, data: { id: 'b1', name: 'ACME', code: 'ACM' } };
  }
  if (url.includes('/products/search')) {
    return { success: true, data: [{ id: 'p1', alegraId: 'a1', code: 'ACM001', name: 'SODA', wholesalePrice: 1000 }] };
  }
  if (url.includes('/products')) {
    return { success: true, data: { items: [product], total: 1, page: 1, pageSize: 10 } };
  }
  if (url.includes('/brands')) {
    return { success: true, data: [{ id: 'b1', name: 'ACME', code: 'ACM' }] };
  }
  if (url.includes('/load-sheets')) {
    return {
      success: true,
      data: {
        lines: [
          {
            productId: 'p1',
            brand: 'ACME',
            name: 'SODA',
            quantity: 2,
            wholesaleCost: 800,
            wholesaleSalePrice: 1000,
            totalPrice: 2000,
            profit: 400,
            priceGroups: []
          }
        ]
      }
    };
  }
  if (url.includes('/invoices/')) {
    return {
      success: true,
      data: {
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
        lines: [{ productId: 'p1', productName: 'SODA', quantity: 2, unitValue: 1000, totalValue: 2000 }],
        subtotal: 2000,
        total: 2000
      }
    };
  }
  if (url.includes('/invoices')) {
    return {
      success: true,
      data: [
        {
          saleId: 's1',
          deliveryDate: '2026-11-14',
          customerId: 'c1',
          invoiceNumber: '001',
          status: 'CONFIRMED',
          totalAmount: 2000
        }
      ]
    };
  }
  if (/\/customers\/[^/?]/.test(url)) {
    return { success: true, data: customer };
  }
  if (url.includes('/customers')) {
    return { success: true, data: [customer] };
  }
  if (url.includes('/sales/s2')) {
    return { success: true, data: { ...sale, id: 's2', status: 'CONFIRMED' } };
  }
  if (/\/sales\/[^/?]/.test(url)) {
    return { success: true, data: sale };
  }
  if (url.includes('/sales')) {
    return { success: true, data: [{ ...sale, status: url.includes('customerId') ? 'DRAFT' : 'CONFIRMED' }] };
  }
  return { success: true, data: [] };
}

function installBrowser() {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function close() {
    this.open = false;
  };
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener() {},
    removeListener() {},
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent() {
      return false;
    }
  });
}

function installFetch() {
  let productWrites = 0;
  const fetchMock: typeof fetch = async (input, init) => {
    const url = String(input);
    const method = init?.method ?? 'GET';
    if (method === 'PUT' && url.includes('/products')) {
      productWrites += 1;
      if (productWrites > 1) {
        return new Response(JSON.stringify({ error: 'sync', code: 'ALEGRA_SYNC_FAILED' }), { status: 502 });
      }
    }
    return new Response(JSON.stringify(bodyFor(url, method)), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    });
  };
  globalThis.fetch = fetchMock;
}

function open(path: string) {
  sessionStorage.setItem(
    'prime-sweets.session',
    JSON.stringify({
      token: 'token',
      expiresAt: '2099-01-01T00:00:00.000Z',
      user: { id: 'u1', email: 'a@b.co', displayName: 'Ada' }
    })
  );
  const router = createMemoryRouter(
    [
      {
        path: '*',
        element: (
          <LocaleProvider>
            <App container={createAppContainer()} />
          </LocaleProvider>
        )
      }
    ],
    { initialEntries: [path] }
  );
  render(<RouterProvider router={router} />);
}

afterEach(() => {
  cleanup();
  sessionStorage.clear();
});

test('the signed-in screens render a sale, the catalog, the load sheet, and an invoice', async () => {
  installBrowser();
  installFetch();
  open('/');
  await waitFor(() => screen.getByText('Entregas'));
  cleanup();

  open('/products');
  await waitFor(() => screen.getByText('ACM001'));
  fireEvent.click(screen.getByRole('button', { name: 'Editar producto' }));
  fireEvent.change(screen.getByDisplayValue('SODA'), { target: { value: 'SODA EXTRA' } });
  fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
  await waitFor(() => screen.getByText(/se actualizó/));
  fireEvent.click(screen.getByRole('button', { name: 'Editar producto' }));
  fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: '' } });
  fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
  fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'SODA EXTRA' } });
  fireEvent.change(screen.getByLabelText('% de ganancia'), { target: { value: '20' } });
  fireEvent.change(screen.getByLabelText('Unidades'), { target: { value: '2' } });
  fireEvent.change(screen.getByLabelText('Caja'), { target: { value: '4' } });
  fireEvent.change(screen.getByLabelText('Venta por mayor'), { target: { value: '1500' } });
  fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
  fireEvent.change(screen.getByLabelText(/buscar producto/i), { target: { value: 'SOD' } });
  fireEvent.click(screen.getByRole('button', { name: /^buscar$/i }));
  fireEvent.change(screen.getByLabelText(/tamaño|page size|por página/i), { target: { value: '20' } });
  fireEvent.click(screen.getByRole('button', { name: 'Volver' }));
  cleanup();

  open('/products/new');
  await waitFor(() => screen.getByText('Crear producto'));
  cleanup();

  open('/customers');
  await waitFor(() => screen.getByLabelText('Número de documento'));
  fireEvent.change(screen.getByLabelText(/número|number/i), { target: { value: '1' } });
  fireEvent.change(screen.getByLabelText(/nombre|name/i), { target: { value: 'ANA' } });
  fireEvent.click(screen.getByRole('button', { name: 'Crear cliente' }));
  cleanup();

  open('/delivery-sales?deliveryDate=2026-11-14');
  await waitFor(() => screen.getByText(/001/));
  const selectAll = screen.queryByRole('button', { name: /seleccionar|select all/i });
  if (selectAll) {
    fireEvent.click(selectAll);
  }
  const printAll = screen.queryByRole('button', { name: /imprimir confirmadas|print confirmed/i });
  if (printAll) {
    fireEvent.click(printAll);
  }
  const voidSale = screen.queryByRole('button', { name: 'Anular venta' });
  if (voidSale) {
    fireEvent.click(voidSale);
    const confirmVoid = screen.queryByRole('button', { name: 'Confirmar' });
    if (confirmVoid) {
      fireEvent.click(confirmVoid);
    }
  }
  cleanup();

  open('/load-sheets?deliveryDate=2026-11-14');
  await waitFor(() => screen.getByText('SODA'));
  cleanup();

  open('/invoices/s1');
  await waitFor(() => screen.getByText(/Dulceria|factura|invoice/i));
  cleanup();

  open('/sales');
  await waitFor(() => screen.getByLabelText(/buscar cliente/i));
  cleanup();

  open('/sales?customerId=c1');
  const today = await screen.findByRole('button', { name: /hoy|today/i });
  fireEvent.click(today);
  cleanup();

  open('/sales?customerId=c1&saleId=s2');
  await waitFor(() => screen.getByText('SODA'));
  fireEvent.click(screen.getByRole('button', { name: 'Cambiar día' }));
  const moveDays = document.querySelectorAll('.delivery-days button');
  fireEvent.click(moveDays[moveDays.length - 1]);
  fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));
  cleanup();

  open('/sales?deliveryDate=2026-11-14&customerId=c1&saleId=s1');
  await waitFor(() => screen.getByText('SODA'));
  const productQuery = screen.queryByLabelText(/buscar producto/i);
  if (productQuery) {
    fireEvent.change(productQuery, { target: { value: 'SODA' } });
    fireEvent.click(screen.getAllByRole('button', { name: /^buscar$/i })[0]);
    const add = await screen.findByRole('button', { name: 'Agregar' });
    fireEvent.click(add);
    const confirmLine = await screen.findByRole('button', { name: 'Guardar cambio' });
    fireEvent.click(confirmLine);
  }
  fireEvent.click(screen.getByRole('button', { name: 'Cambiar día' }));
  const days = document.querySelectorAll('.delivery-days button');
  fireEvent.click(days[days.length - 1]);
  await waitFor(() => {
    const confirmSale = screen.getByRole('button', { name: 'Confirmar venta' });
    if ((confirmSale as HTMLButtonElement).disabled) {
      throw new Error('wait');
    }
  });
  fireEvent.click(screen.getByRole('button', { name: 'Confirmar venta' }));
  const quantity = screen.queryAllByRole('spinbutton')[0] ?? screen.queryAllByRole('textbox').at(-1);
  if (quantity) {
    fireEvent.change(quantity, { target: { value: '3' } });
  }
  const saveLine = screen.queryByRole('button', { name: 'Guardar cambio' });
  if (saveLine) {
    fireEvent.click(saveLine);
  }
  fireEvent.click(screen.getByRole('button', { name: 'Salir' }));
});
