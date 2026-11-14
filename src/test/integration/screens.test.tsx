import { cleanup, render, screen, waitFor } from '@testing-library/react';
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

function bodyFor(url: string): unknown {
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
  if (/\/sales\/[^/?]/.test(url)) {
    return { success: true, data: sale };
  }
  if (url.includes('/sales')) {
    return { success: true, data: [sale] };
  }
  return { success: true, data: [] };
}

function installBrowser() {
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
  const fetchMock: typeof fetch = async (input) => {
    const url = String(input);
    return new Response(JSON.stringify(bodyFor(url)), { status: 200, headers: { 'content-type': 'application/json' } });
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
  cleanup();

  open('/products/new');
  await waitFor(() => screen.getByText('Crear producto'));
  cleanup();

  open('/customers');
  await waitFor(() => {
    const text = document.body.textContent ?? '';
    if (!/cliente|customer|documento/i.test(text)) {
      throw new Error(text.slice(0, 500));
    }
  });
  cleanup();

  open('/delivery-sales?deliveryDate=2026-11-14');
  await waitFor(() => screen.getByText(/001/));
  cleanup();

  open('/load-sheets?deliveryDate=2026-11-14');
  await waitFor(() => screen.getByText('SODA'));
  cleanup();

  open('/invoices/s1');
  await waitFor(() => screen.getByText(/Dulceria|factura|invoice/i));
  cleanup();

  open('/sales?deliveryDate=2026-11-14&customerId=c1&saleId=s1');
  await waitFor(() => screen.getByText('SODA'));
});
