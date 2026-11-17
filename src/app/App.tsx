import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, Outlet, Route, Routes, useBlocker, useLocation, useNavigate, useParams, useSearchParams } from 'react-router';
import { AppShellNav } from '@/app/AppShell';
import { DeliveryDayCard } from '@/app/DeliveryDayCard';
import { RetailSection } from '@/modules/retail-sales/adapters/ui/views/RetailSection';
import { RetailHistoryView } from '@/modules/retail-sales/adapters/ui/views/RetailHistoryView';
import { RetailTodayView } from '@/modules/retail-sales/adapters/ui/views/RetailTodayView';
import { SelectedCustomer } from '@/app/SelectedCustomer';
import type { AppContainer } from '@/app/composition';
import { CustomerList } from '@/modules/customers/adapters/ui/views/CustomerList';
import { SaleCustomerChoice } from '@/modules/customers/adapters/ui/views/SaleCustomerChoice';
import { InvoicePreview } from '@/modules/fulfillment-output/adapters/ui/views/InvoicePreview';
import { LoadSheetList } from '@/modules/fulfillment-output/adapters/ui/views/LoadSheetList';
import { useConfirmSale } from '@/modules/sales/adapters/ui/hooks/useConfirmSale';
import { saleErrorKey } from '@/modules/sales/adapters/ui/hooks/saleErrorKey';
import { useDraftSale } from '@/modules/sales/adapters/ui/hooks/useDraftSale';
import { useSaleMutations } from '@/modules/sales/adapters/ui/hooks/useSaleMutations';
import { DaySalesList } from '@/modules/sales/adapters/ui/views/DaySalesList';
import { SaleLines, type PendingLine } from '@/modules/sales/adapters/ui/views/SaleLines';
import { PurchaseOrderSheetView } from '@/modules/purchasing/adapters/ui/views/PurchaseOrderSheetView';
import { PurchaseOrderView } from '@/modules/purchasing/adapters/ui/views/PurchaseOrderView';
import { SupplierDetailView } from '@/modules/purchasing/adapters/ui/views/SupplierDetailView';
import { SupplierListView } from '@/modules/purchasing/adapters/ui/views/SupplierListView';
import { ProductAdmin } from '@/modules/catalog/adapters/ui/views/ProductAdmin';
import { ProductCreate } from '@/modules/catalog/adapters/ui/views/ProductCreate';
import { ProductSearchView } from '@/modules/catalog/adapters/ui/views/ProductSearchView';
import { LoginView } from '@/modules/identity/adapters/ui/views/LoginView';
import { WeekHome } from '@/modules/sales/adapters/ui/views/WeekHome';
import type { Session } from '@/modules/identity/domain/models/session';
import { useLocale } from '@/shared/i18n/useLocale';
import type { MessageKey } from '@/shared/i18n/messages';
import { NavigationHistory, ScreenTitle } from '@/shared/ui/BackButton';
import { ScreenErrorBoundary, ScreenMonitor } from '@/shared/ui/Monitor';
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog';
import { StatusMessage } from '@/shared/ui/StatusMessage';

interface AppProps {
  container: AppContainer;
}

function SupplierPage({ container }: { container: AppContainer }) {
  const { supplierId = '' } = useParams();
  const [params] = useSearchParams();
  const orderId = params.get('order');
  return (
    <SupplierDetailView
      supplierId={supplierId}
      orderId={orderId}
      getSupplier={container.getSupplier}
      setSupplierProducts={container.setSupplierProducts}
      searchProducts={container.searchProducts}
      listPurchaseOrders={container.listPurchaseOrders}
      createPurchaseOrder={container.createPurchaseOrder}
      updatePurchaseOrder={container.updatePurchaseOrder}
    />
  );
}

function PurchaseSheetPage({ container }: { container: AppContainer }) {
  const { supplierId = '' } = useParams();
  return (
    <PurchaseOrderSheetView
      supplierId={supplierId}
      getSupplier={container.getSupplier}
      createPurchaseOrder={container.createPurchaseOrder}
    />
  );
}

function PurchaseOrderPage({ container }: { container: AppContainer }) {
  const { orderId = '' } = useParams();
  return <PurchaseOrderView orderId={orderId} getPurchaseOrder={container.getPurchaseOrder} />;
}

function DeliverySalesPage({ container }: { container: AppContainer }) {
  const [params] = useSearchParams();
  return (
    <DaySalesList
      deliveryDate={params.get('deliveryDate') ?? undefined}
      listDeliverySales={container.listDeliverySales}
      voidSale={container.voidSale}
      printInvoices={container.printInvoices}
    />
  );
}

function SaleSearch({ container }: { container: AppContainer }) {
  const { t } = useLocale();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const customerId = params.get('customerId');
  const saleId = params.get('saleId');
  const [deliveryDate, setDeliveryDate] = useState<string | null>(null);
  const [pendingMove, setPendingMove] = useState<string | null>(null);
  const [changingCustomer, setChangingCustomer] = useState(false);
  const [customerError, setCustomerError] = useState<MessageKey | null>(null);
  const [deliveryError, setDeliveryError] = useState<MessageKey | null>(null);
  const [pending, setPending] = useState<PendingLine | null>(null);
  const [searchOutcome, setSearchOutcome] = useState<{ id: number; added: boolean } | null>(null);
  const searchOutcomeId = useRef(0);
  const [editingLine, setEditingLine] = useState(false);
  const [editNotice, setEditNotice] = useState(false);
  const allowLeave = useRef(false);
  const blocker = useBlocker(() => editingLine && !allowLeave.current);
  const draft = useDraftSale(
    customerId,
    saleId,
    deliveryDate,
    container.listDraftSales,
    container.createDraftSale,
    container.getSale
  );
  const shownCustomerId = draft.sale?.customerId ?? customerId;
  const customerLocked = Boolean(saleId || draft.sale);
  const canEditLines = !draft.sale || draft.sale.status === 'DRAFT';
  const confirmation = useConfirmSale(container.confirmSale, draft.setSale);
  useEffect(() => {
    if (!editingLine) {
      setEditNotice(false);
    }
  }, [editingLine]);

  useEffect(() => {
    if (blocker.state === 'blocked') {
      setEditNotice(true);
      blocker.reset();
    }
  }, [blocker]);

  function moveDelivery(date: string) {
    const current = draft.sale;
    if (!current) {
      return;
    }
    void container.setSaleDeliveryDate
      .execute(current.id, date)
      .then(saved => {
        setDeliveryError(null);
        if (saved.id !== current.id) {
          allowLeave.current = true;
          navigate(`/sales?saleId=${encodeURIComponent(saved.id)}`);
          return;
        }
        draft.setSale(saved);
      })
      .catch((caught: unknown) => {
        setDeliveryError(saleErrorKey(caught, 'saleLineFailed'));
      });
  }

  const lines = useSaleMutations(
    draft.sale,
    draft.setSale,
    container.addSaleItem,
    container.updateSaleItemQuantity,
    container.updateSaleItemName,
    container.removeSaleItem
  );
  return (
    <div className="sale-screen">
      <ScreenTitle>{t('sale')}</ScreenTitle>
      {(!shownCustomerId || changingCustomer) && !draft.loading && !customerLocked ? (
        <SaleCustomerChoice
          searchCustomers={container.searchCustomers}
          createCustomer={container.createCustomer}
          changing={changingCustomer}
          onCancelChange={() => setChangingCustomer(false)}
          onSelect={id => {
            setCustomerError(null);
            setChangingCustomer(false);
            setDeliveryDate(null);
            setParams({ customerId: id });
          }}
        />
      ) : (
        <SelectedCustomer
          customerId={shownCustomerId}
          getCustomer={container.getCustomer}
          updateCustomer={container.updateCustomer}
          canEdit={!customerLocked}
          onChange={
            customerLocked
              ? undefined
              : () => {
                  setCustomerError(null);
                  setChangingCustomer(true);
                }
          }
        />
      )}
      {customerError ? <StatusMessage tone="error">{t(customerError)}</StatusMessage> : null}
      {shownCustomerId ? (
        <DeliveryDayCard
          selectedDate={draft.sale?.deliveryDate ?? null}
          disabled={Boolean(draft.sale) && !canEditLines}
          onSelect={date => {
            const current = draft.sale;
            if (!current) {
              setDeliveryDate(date);
              return;
            }
            if (date === current.deliveryDate || !canEditLines) {
              return;
            }
            setPendingMove(date);
          }}
        />
      ) : null}
      {deliveryError ? <StatusMessage tone="error">{t(deliveryError)}</StatusMessage> : null}
      {pendingMove && draft.sale ? (
        <ConfirmDialog
          title={t('changeDeliveryDay')}
          message={(draft.sale.invoiceNumber ? t('confirmMoveInvoice').replace('{number}', draft.sale.invoiceNumber) : t('confirmMoveSale'))
            .replace('{from}', shortDate(draft.sale.deliveryDate))
            .replace('{to}', shortDate(pendingMove))}
          confirmLabel={t('confirmAction')}
          cancelLabel={t('cancelAction')}
          onConfirm={() => {
            const date = pendingMove;
            setPendingMove(null);
            moveDelivery(date);
          }}
          onCancel={() => setPendingMove(null)}
        />
      ) : null}
      {shownCustomerId && draft.sale && canEditLines ? (
        <ProductSearchView
          searchProducts={container.searchProducts}
          selecting={lines.busy || confirmation.confirming}
          outcome={searchOutcome}
          onSelect={product =>
            setPending({
              productId: product.id,
              name: product.name ?? product.code,
              unitPrice: product.wholesalePrice
            })
          }
        />
      ) : null}
      <SaleLines
        sale={draft.sale}
        loading={draft.loading}
        error={draft.error}
        lineError={lines.error}
        busy={lines.busy || confirmation.confirming}
        confirming={confirmation.confirming}
        confirmError={confirmation.error}
        onReopen={() => {
          const current = draft.sale;
          if (!current) {
            return;
          }
          void container.reopenSale
            .execute(current.id)
            .then(saved => {
              draft.setSale(saved);
            })
            .catch((caught: unknown) => {
              setDeliveryError(saleErrorKey(caught, 'saleLineFailed'));
            });
        }}
        onConfirm={updated => {
          const current = updated ?? draft.sale;
          if (current?.status === 'CONFIRMED') {
            allowLeave.current = true;
            navigate(current.deliveryDate ? `/delivery-sales?deliveryDate=${encodeURIComponent(current.deliveryDate)}` : '/');
            return;
          }
          void confirmation.confirm(current).then(saved => {
            if (saved) {
              navigate(saved.deliveryDate ? `/?deliveryDate=${encodeURIComponent(saved.deliveryDate)}` : '/');
            }
          });
        }}
        pending={pending}
        onAcceptPending={(name, quantity) => {
          if (!pending) {
            return Promise.resolve(null);
          }
          return lines.accept(pending.productId, quantity, name).then(saved => {
            if (saved) {
              searchOutcomeId.current += 1;
              setSearchOutcome({ id: searchOutcomeId.current, added: true });
              setPending(null);
            }
            return saved;
          });
        }}
        onCancelPending={() => {
          setPending(null);
          searchOutcomeId.current += 1;
          setSearchOutcome({ id: searchOutcomeId.current, added: false });
        }}
        onEditingChange={setEditingLine}
        editNotice={editNotice}
        onEditBlocked={() => setEditNotice(true)}
        onDismissEditNotice={() => setEditNotice(false)}
        onRemove={productId => void lines.remove(productId)}
        onQuantity={(productId, quantity) => lines.changeQuantity(productId, quantity)}
        onName={(productId, itemName) => lines.changeName(productId, itemName) ?? Promise.resolve(null)}
      />
    </div>
  );
}

export function App({ container }: AppProps) {
  const { t, toggleLocale, locale } = useLocale();
  const shellRef = useRef<HTMLDivElement>(null);
  const [session, setSession] = useState<Session | null>(() => container.sessionStore.read());

  useEffect(() => {
    const sync = () => setSession(container.sessionStore.read());
    const stop = container.sessionStore.subscribe(sync);
    window.addEventListener('focus', sync);
    return () => {
      stop();
      window.removeEventListener('focus', sync);
    };
  }, [container]);

  useEffect(() => {
    if (!session) {
      return;
    }
    const remaining = Date.parse(session.expiresAt) - Date.now();
    if (!Number.isFinite(remaining) || remaining > 2_147_483_647) {
      return;
    }
    const timer = window.setTimeout(() => setSession(container.sessionStore.read()), Math.max(0, remaining));
    return () => window.clearTimeout(timer);
  }, [container, session]);

  useEffect(() => {
    const shell = shellRef.current;
    const head = shell?.querySelector('.shell-head');
    if (!shell || !head) {
      return;
    }
    const sync = () => {
      shell.style.setProperty('--shell-head-offset', `${head.getBoundingClientRect().height}px`);
    };
    sync();
    if (typeof ResizeObserver === 'undefined') {
      return;
    }
    const observer = new ResizeObserver(sync);
    observer.observe(head);
    return () => observer.disconnect();
  }, [session]);

  async function signOut() {
    try {
      await container.logout.execute();
    } finally {
      setSession(null);
    }
  }

  return (
    <NavigationHistory>
    <ScreenMonitor />
    <div className="shell" ref={shellRef}>
      <div className="shell-head">
      <header className="topbar">
        <Link to={session ? '/' : '/login'} aria-label={t('home')}>
          <img className="shell-logo" src="/logo.webp" alt="Dulcería La Principal" />
        </Link>
        {session ? (
          <button type="button" className="lang" onClick={() => void signOut()}>
            {t('signOut')}
          </button>
        ) : null}
        <button type="button" className="lang" aria-label={t('languageLabel')} onClick={toggleLocale}>
          <span className={locale === 'es' ? 'lang-current' : undefined}>ES</span>
          {' | '}
          <span className={locale === 'en' ? 'lang-current' : undefined}>EN</span>
        </button>
      </header>
      </div>
      <div className={session ? 'app-frame' : undefined}>
      {session ? <AppShellNav /> : null}
      <main>
        <ScreenErrorBoundary>
        <Routes>
          <Route
            path="/login"
            element={
              session ? (
                <NavigateAfterLogin />
              ) : (
                <LoginView login={container.login} onLoggedIn={setSession} />
              )
            }
          />
          <Route element={session ? <Outlet /> : <ReturnToLogin />}>
          <Route path="/" element={<WeekHome listSales={container.listDeliverySales} />} />
          <Route path="/sales-day" element={<Navigate to="/" replace />} />
          <Route
            path="/products/new"
            element={
              <ProductCreate
                createCatalogProduct={container.createCatalogProduct}
                listBrands={container.listBrands}
                createBrand={container.createBrand}
              />
            }
          />
          <Route
            path="/products"
            element={
              <ProductAdmin
                searchCatalogProducts={container.searchCatalogProducts}
                updateCatalogProduct={container.updateCatalogProduct}
              />
            }
          />
          <Route path="/customers" element={<CustomerList createCustomer={container.createCustomer} />} />
          <Route path="/delivery-sales" element={<DeliverySalesPage container={container} />} />
          <Route path="/day-sales/:salesDayId?" element={<Navigate to="/" replace />} />
          <Route path="/sales" element={<SaleSearch container={container} />} />
          <Route path="/load-sheets" element={<LoadSheetList listLoadSheet={container.listLoadSheet} />} />
          <Route path="/purchasing/orders/:orderId" element={<PurchaseOrderPage container={container} />} />
          <Route path="/purchasing/:supplierId/order" element={<PurchaseSheetPage container={container} />} />
          <Route path="/purchasing/:supplierId" element={<SupplierPage container={container} />} />
          <Route
            path="/purchasing"
            element={
              <SupplierListView
                listSuppliers={container.listSuppliers}
                createSupplier={container.createSupplier}
                renameSupplier={container.renameSupplier}
              />
            }
          />
          <Route
            path="/retail-sales/history"
            element={
              <RetailSection>
                <RetailHistoryView listDays={container.listRetailDays} reviewDays={container.reviewRetailDays} />
              </RetailSection>
            }
          />
          <Route
            path="/retail-sales"
            element={
              <RetailSection>
                <RetailTodayView
                  getToday={container.getTodayRetailDay}
                  searchProducts={container.searchRetailProducts}
                  addItem={container.addRetailItem}
                  setQuantity={container.setRetailItemQuantity}
                  removeItem={container.removeRetailItem}
                />
              </RetailSection>
            }
          />
          <Route
            path="/invoices/:saleId"
            element={<InvoicePreview generateInvoice={container.generateInvoice} printInvoices={container.printInvoices} />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
        </ScreenErrorBoundary>
      </main>
      </div>
    </div>
    </NavigationHistory>
  );
}

function ReturnToLogin() {
  const location = useLocation();
  const next = `${location.pathname}${location.search}`;
  const target = next === '/' ? '/login' : `/login?next=${encodeURIComponent(next)}`;
  return <Navigate to={target} replace />;
}

function NavigateAfterLogin() {
  const [params] = useSearchParams();
  return <Navigate to={returnPath(params.get('next'))} replace />;
}

function returnPath(next: string | null): string {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/login')) {
    return '/';
  }
  return next;
}

function shortDate(value: string): string {
  const [year, month, day] = value.slice(0, 10).split('-');
  if (!year || !month || !day) {
    return value;
  }
  return `${day}/${month}/${year}`;
}

