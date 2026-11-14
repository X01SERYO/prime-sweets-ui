import { useState } from 'react';
import { HttpRequestError } from '../../shared/infrastructure/http/httpClient.ts';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, test } from 'vitest';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { ProductCreate } from '../../modules/catalog/adapters/ui/views/ProductCreate.tsx';
import { ProductSearchView } from '../../modules/catalog/adapters/ui/views/ProductSearchView.tsx';
import { SaleCustomerChoice } from '../../modules/customers/adapters/ui/views/SaleCustomerChoice.tsx';
import { LoginView } from '../../modules/identity/adapters/ui/views/LoginView.tsx';
import { useConfirmSale } from '../../modules/sales/adapters/ui/hooks/useConfirmSale.ts';
import { useCreateCustomer } from '../../modules/customers/adapters/ui/hooks/useCreateCustomer.ts';
import { useInvoices } from '../../modules/fulfillment-output/adapters/ui/hooks/useInvoices.ts';
import { usePrintInvoices } from '../../modules/fulfillment-output/adapters/ui/hooks/usePrintInvoices.ts';
import { useSaleMutations } from '../../modules/sales/adapters/ui/hooks/useSaleMutations.ts';
import { useVoidListedSale } from '../../modules/sales/adapters/ui/hooks/useVoidListedSale.ts';
import { useVoidSale } from '../../modules/sales/adapters/ui/hooks/useVoidSale.ts';
import { DeliveryDateModal } from '../../modules/sales/adapters/ui/views/DeliveryDateModal.tsx';
import { SaleLines } from '../../modules/sales/adapters/ui/views/SaleLines.tsx';
import type { SaleModel } from '../../modules/sales/domain/models/sale.ts';
import { LocaleProvider } from '../../shared/i18n/locale.tsx';

const sale: SaleModel = {
  id: 's1',
  sellerId: 'u1',
  customerId: 'c1',
  status: 'DRAFT',
  captureDate: '2026-11-14',
  deliveryDate: '2026-11-14',
  invoiceNumber: null,
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
      itemName: 'SODA extra',
      quantity: 2,
      wholesalePrice: 1000,
      totalPrice: 2000
    }
  ]
};

function Hooks() {
  const invoices = useInvoices('2026-11-14', { execute: async () => [] });
  const printing = usePrintInvoices({ execute: async () => undefined });
  const customer = useCreateCustomer({
    execute: async () => ({
      id: 'c1',
      documentType: 'CC',
      documentNumber: '1',
      name: 'ANA',
      phone: null,
      email: null,
      address: null
    })
  });
  const confirmation = useConfirmSale({ execute: async () => sale }, () => undefined);
  const voiding = useVoidSale({ execute: async () => ({ ...sale, status: 'VOIDED' }) }, () => undefined);
  const listed = useVoidListedSale({ execute: async () => undefined }, () => undefined);
  return (
    <div>
      <button type="button" onClick={() => void printing.print(['s1'])}>
        print
      </button>
      <button type="button" onClick={() => void printing.print([])}>
        print-empty
      </button>
      <button
        type="button"
        onClick={() => {
          customer.setDocumentNumber('1');
          customer.setName('ANA');
          void customer.submit();
        }}
      >
        customer
      </button>
      <button type="button" onClick={() => void confirmation.confirm(sale)}>
        confirm-hook
      </button>
      <button type="button" onClick={() => void voiding.voidConfirmed({ ...sale, status: 'CONFIRMED' })}>
        void-hook
      </button>
      <button type="button" onClick={() => void listed.voidConfirmed('s1')}>
        void-listed
      </button>
      <span>{invoices.loading ? 'loading' : 'ready'}</span>
    </div>
  );
}

function FailingMutations() {
  const failing = {
    execute: async () => {
      throw new Error('no');
    }
  };
  const actions = useSaleMutations(sale, () => undefined, failing, failing, failing, failing);
  const closed = useSaleMutations({ ...sale, status: 'VOIDED' }, () => undefined, failing, failing, failing, failing);
  return (
    <div>
      <button type="button" onClick={() => void actions.accept('p1', 1, ' ')}>
        blank
      </button>
      <button type="button" onClick={() => void actions.accept('p1', 1, 'SODA')}>
        add-fail
      </button>
      <button type="button" onClick={() => void actions.changeName('i1', ' ')}>
        name-blank
      </button>
      <button type="button" onClick={() => void closed.changeQuantity('i1', 1)}>
        closed
      </button>
    </div>
  );
}

function Mutations() {
  const [current, setCurrent] = useState(sale);
  const actions = useSaleMutations(
    current,
    setCurrent,
    { execute: async () => current },
    { execute: async () => ({ ...current, totalQuantity: 3 }) },
    { execute: async () => current },
    { execute: async () => current }
  );
  return (
    <div>
      <button type="button" onClick={() => void actions.accept('p1', 1, 'SODA')}>
        add
      </button>
      <button type="button" onClick={() => void actions.changeQuantity('i1', 3)}>
        qty
      </button>
      <button type="button" onClick={() => void actions.changeName('i1', 'SODA extra')}>
        name
      </button>
      <button type="button" onClick={() => void actions.remove('i1')}>
        drop
      </button>
      <button type="button" onClick={() => void actions.changeQuantity('i1', 0)}>
        bad
      </button>
    </div>
  );
}

function Page() {
  return (
    <LocaleProvider>
      <ProductCreate
        listBrands={{ execute: async () => [{ id: 'b1', name: 'ACME', code: 'ACM' }] }}
        createBrand={{ execute: async () => ({ id: 'b2', name: 'NUEVA', code: 'NUE' }) }}
        createCatalogProduct={{
          execute: async () => ({
            id: 'p2',
            code: 'ACM002',
            name: 'GALLETA',
            brandName: 'ACME',
            units: 1,
            pack: 1,
            wholesaleCost: 800,
            wholesalePrice: 1000,
            retailCost: 800,
            retailPrice: 1200
          })
        }}
      />
      <SaleLines
        sale={sale}
        loading={false}
        error={null}
        lineError={null}
        busy={false}
        confirming={false}
        confirmError={null}
        onConfirm={() => undefined}
        pending={{ productId: 'p2', name: 'GALLETA', unitPrice: 1000 }}
        onAcceptPending={async () => sale}
        onCancelPending={() => undefined}
        onEditingChange={() => undefined}
        editNotice
        onEditBlocked={() => undefined}
        onDismissEditNotice={() => undefined}
        onRemove={() => undefined}
        onQuantity={async () => sale}
        onName={async () => sale}
      />
      <ProductSearchView
        searchProducts={{
          execute: async () => [{ id: 'p1', code: 'ACM001', name: 'SODA', wholesalePrice: 1000 }]
        }}
        onSelect={() => undefined}
      />
      <SaleCustomerChoice
        searchCustomers={{
          execute: async () => [
            {
              id: 'c1',
              documentType: 'CC',
              documentNumber: '1',
              name: 'ANA',
              phone: '300',
              email: 'a@b.co',
              address: 'Calle 1'
            }
          ]
        }}
        onSelect={() => undefined}
      />
      <LoginView
        login={{
          execute: async () => ({
            token: 't',
            expiresAt: '2099-01-01T00:00:00.000Z',
            user: { id: 'u', email: 'a@b.co', displayName: 'Ada' }
          })
        }}
        onLoggedIn={() => undefined}
      />
      <DeliveryDateModal
        onSelect={() => undefined}
        onClose={() => undefined}
        days={[{ date: '2026-11-14', weekday: 6 }]}
      />
      <Mutations />
      <FailingMutations />
      <Hooks />
    </LocaleProvider>
  );
}

afterEach(cleanup);

test('editing a product, a sale line, and a search runs the screen actions', async () => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function close() {
    this.open = false;
  };
  window.matchMedia = () => ({
    matches: false,
    media: '',
    onchange: null,
    addListener() {},
    removeListener() {},
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent() {
      return false;
    }
  });
  const router = createMemoryRouter([{ path: '*', element: <Page /> }], { initialEntries: ['/'] });
  render(<RouterProvider router={router} />);

  fireEvent.focus(screen.getAllByRole('textbox')[0]);
  fireEvent.click(await screen.findByRole('button', { name: 'ACME' }));
  fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'GALLETA' } });
  fireEvent.change(screen.getByLabelText('Costo por mayor'), { target: { value: '800' } });
  fireEvent.change(screen.getByLabelText('Venta por mayor'), { target: { value: '1000' } });
  fireEvent.change(screen.getByLabelText('Venta por menor'), { target: { value: '1200' } });
  fireEvent.change(screen.getByLabelText('Unidades'), { target: { value: '1' } });
  const saveProduct = document.querySelector('.product-editor-actions .btn:last-child') as HTMLButtonElement;
  const values = [...document.querySelectorAll('.product-editor input')]
    .map(node => (node as HTMLInputElement).value)
    .join('|');
  if (saveProduct.disabled) {
    throw new Error(values);
  }
  fireEvent.click(saveProduct);
  fireEvent.click(screen.getByRole('button', { name: 'Agregar marca' }));
  fireEvent.change(screen.getAllByLabelText('Nombre')[1], { target: { value: 'NUEVA' } });
  fireEvent.change(screen.getByLabelText('Código'), { target: { value: 'NUE' } });
  fireEvent.click(screen.getAllByRole('button', { name: 'Guardar' })[0]);

  fireEvent.click(screen.getByRole('button', { name: 'Quitar' }));
  fireEvent.click(screen.getAllByRole('button', { name: 'Guardar' }).at(-1)!);
  fireEvent.click(screen.getByRole('button', { name: 'Confirmar venta' }));
  fireEvent.click(screen.getByRole('button', { name: 'Editar' }));
  fireEvent.change(screen.getAllByLabelText('Producto').at(-1)!, { target: { value: 'SODA extra roja' } });
  fireEvent.change(screen.getAllByLabelText('Cantidad').at(-1)!, { target: { value: '4' } });
  fireEvent.click(screen.getAllByRole('button', { name: 'Guardar' }).at(-1)!);

  fireEvent.change(screen.getByLabelText(/buscar producto|search product/i), { target: { value: 'SODA' } });
  fireEvent.click(screen.getAllByRole('button', { name: /buscar|search/i })[0]);
  await waitFor(() => screen.getByText('ACM001'));

  fireEvent.change(screen.getByLabelText(/buscar cliente|search customer/i), { target: { value: 'ANA' } });
  fireEvent.click(screen.getAllByRole('button', { name: /buscar|search/i })[1]);
  await waitFor(() => screen.getByText('ANA'));

  fireEvent.change(document.getElementById('login-email')!, { target: { value: 'a@b.co' } });
  fireEvent.change(document.getElementById('login-password')!, { target: { value: 'secret' } });
  fireEvent.click(screen.getAllByRole('button', { name: /entrar|sign in/i })[0]);

  fireEvent.click(screen.getByRole('button', { name: 'qty' }));
  fireEvent.click(screen.getByRole('button', { name: 'add' }));
  fireEvent.click(screen.getByRole('button', { name: 'name' }));
  fireEvent.click(screen.getByRole('button', { name: 'drop' }));
  fireEvent.click(screen.getByRole('button', { name: 'bad' }));
  fireEvent.click(screen.getByRole('button', { name: 'blank' }));
  fireEvent.click(screen.getByRole('button', { name: 'add-fail' }));
  fireEvent.click(screen.getByRole('button', { name: 'name-blank' }));
  fireEvent.click(screen.getByRole('button', { name: 'closed' }));
  fireEvent.click(screen.getByRole('button', { name: 'print' }));
  fireEvent.click(screen.getByRole('button', { name: 'print-empty' }));
  fireEvent.click(screen.getByRole('button', { name: 'customer' }));
  fireEvent.click(screen.getByRole('button', { name: 'confirm-hook' }));
  fireEvent.click(screen.getByRole('button', { name: 'void-hook' }));
  fireEvent.click(screen.getByRole('button', { name: 'void-listed' }));
});

test('a narrow sale shows each line as a card', () => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function close() {
    this.open = false;
  };
  window.matchMedia = () => ({
    matches: true,
    media: '',
    onchange: null,
    addListener() {},
    removeListener() {},
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent() {
      return false;
    }
  });
  render(
    <LocaleProvider>
      <SaleLines
        sale={sale}
        loading={false}
        error="saleInvalid"
        lineError="saleLineFailed"
        busy={false}
        confirming={false}
        confirmError="saleConfirmFailed"
        onConfirm={() => undefined}
        pending={null}
        onAcceptPending={async () => sale}
        onCancelPending={() => undefined}
        onEditingChange={() => undefined}
        editNotice={false}
        onEditBlocked={() => undefined}
        onDismissEditNotice={() => undefined}
        onRemove={() => undefined}
        onQuantity={async () => sale}
        onName={async () => sale}
      />
    </LocaleProvider>
  );
  fireEvent.click(screen.getByRole('button', { name: /SODA extra/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Editar' }));
  fireEvent.click(screen.getAllByRole('button', { name: 'Guardar' })[0]);
});

test('creating a product reports a duplicate and an invalid brand', async () => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.open = true;
  };
  const router = createMemoryRouter(
    [
      {
        path: '*',
        element: (
          <LocaleProvider>
            <ProductCreate
              listBrands={{ execute: async () => [] }}
              createBrand={{
                execute: async () => {
                  throw new HttpRequestError(409, 'ya existe', 'BRAND_EXISTS');
                }
              }}
              createCatalogProduct={{
                execute: async () => {
                  throw new HttpRequestError(409, 'ya existe', 'PRODUCT_ALREADY_EXISTS');
                }
              }}
            />
          </LocaleProvider>
        )
      }
    ],
    { initialEntries: ['/products/new'] }
  );
  render(<RouterProvider router={router} />);
  fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'GALLETA' } });
  fireEvent.change(screen.getByLabelText('Costo por mayor'), { target: { value: '800' } });
  fireEvent.change(screen.getByLabelText('Unidades'), { target: { value: '1' } });
  fireEvent.click(document.querySelector('.product-editor-actions .btn:last-child')!);
  fireEvent.change(screen.getByLabelText('Venta por mayor'), { target: { value: '1000' } });
  fireEvent.change(screen.getByLabelText('Venta por menor'), { target: { value: '1200' } });
  fireEvent.click(document.querySelector('.product-editor-actions .btn:last-child')!);
  await waitFor(() => screen.getByRole('alert'));
  fireEvent.click(screen.getByRole('button', { name: 'Agregar marca' }));
  fireEvent.change(screen.getAllByLabelText('Nombre')[1], { target: { value: 'NUEVA' } });
  fireEvent.change(screen.getByLabelText('Código'), { target: { value: 'NUE' } });
  fireEvent.click(document.querySelector('.product-brand-save')!);
});
