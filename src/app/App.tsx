import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, Route, Routes, useBlocker, useNavigate, useParams, useSearchParams } from 'react-router';
import { DeliveryDayCard } from '@/app/DeliveryDayCard';
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
import { DeliveryDateModal } from '@/modules/sales/adapters/ui/views/DeliveryDateModal';
import { businessToday, deliveryDaysThroughSunday } from '@/modules/sales/domain/deliveryDays';
import { DaySalesList } from '@/modules/sales/adapters/ui/views/DaySalesList';
import { SaleLines, type PendingLine } from '@/modules/sales/adapters/ui/views/SaleLines';
import { ProductSearchView } from '@/modules/catalog/adapters/ui/views/ProductSearchView';
import { LoginView } from '@/modules/identity/adapters/ui/views/LoginView';
import { SalesDayHome } from '@/modules/sales-day/adapters/ui/views/SalesDayHome';
import type { Session } from '@/modules/identity/domain/models/session';
import { useLocale } from '@/shared/i18n/useLocale';
import type { MessageKey } from '@/shared/i18n/messages';
import { NavigationHistory, ScreenTitle } from '@/shared/ui/BackButton';

interface AppProps {
  container: AppContainer;
}

function InvoiceListRedirect() {
  const { salesDayId } = useParams();
  return <Navigate to={salesDayId ? `/day-sales/${salesDayId}` : '/sales-day'} replace />;
}

function DeliverySalesPage({ container, sellerId }: { container: AppContainer; sellerId: string }) {
  const [params] = useSearchParams();
  return (
    <DaySalesList
      sellerId={sellerId}
      deliveryDate={params.get('deliveryDate') ?? undefined}
      getCurrentSalesDay={container.getCurrentSalesDay}
      listDaySales={container.listDaySales}
      listDeliverySales={container.listDeliverySales}
      voidSale={container.voidSale}
      printInvoices={container.printInvoices}
    />
  );
}

function DaySalesPage({ container, sellerId }: { container: AppContainer; sellerId: string }) {
  const { salesDayId } = useParams();
  return (
    <DaySalesList
      sellerId={sellerId}
      salesDayId={salesDayId}
      getCurrentSalesDay={container.getCurrentSalesDay}
      listDaySales={container.listDaySales}
      voidSale={container.voidSale}
      printInvoices={container.printInvoices}
    />
  );
}

function SaleSearch({ container, sellerId }: { container: AppContainer; sellerId: string }) {
  const { t } = useLocale();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const customerId = params.get('customerId');
  const saleId = params.get('saleId');
  const [deliveryDate, setDeliveryDate] = useState<string | null>(null);
  const [changingDelivery, setChangingDelivery] = useState(false);
  const [deliveryError, setDeliveryError] = useState<MessageKey | null>(null);
  const [pending, setPending] = useState<PendingLine | null>(null);
  const [searchOutcome, setSearchOutcome] = useState<{ id: number; added: boolean } | null>(null);
  const searchOutcomeId = useRef(0);
  const [editingLine, setEditingLine] = useState(false);
  const [editNotice, setEditNotice] = useState(false);
  const allowLeave = useRef(false);
  const blocker = useBlocker(() => editingLine && !allowLeave.current);
  const draft = useDraftSale(
    sellerId,
    customerId,
    saleId,
    deliveryDate,
    container.getCurrentSalesDay,
    container.listDraftSales,
    container.createDraftSale,
    container.getSale
  );
  const shownCustomerId = draft.sale?.customerId ?? customerId;
  const canEditLines = !draft.sale || draft.sale.status === 'DRAFT' || draft.sale.status === 'CONFIRMED';
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
      {!shownCustomerId && !draft.loading ? (
        <SaleCustomerChoice searchCustomers={container.searchCustomers} onSelect={id => setParams({ customerId: id })} />
      ) : (
        <SelectedCustomer customerId={shownCustomerId} getCustomer={container.getCustomer} />
      )}
      {draft.sale?.deliveryDate ? (
        <DeliveryDayCard
          deliveryDate={draft.sale.deliveryDate}
          onChange={canEditLines ? () => setChangingDelivery(true) : undefined}
        />
      ) : null}
      {deliveryError ? <p role="alert">{t(deliveryError)}</p> : null}
      {changingDelivery && draft.sale ? (
        <DeliveryDateModal
          title={t('changeDeliveryDay')}
          days={deliveryDaysThroughSunday(businessToday())}
          onClose={() => setChangingDelivery(false)}
          onSelect={date => {
            void container.setSaleDeliveryDate
              .execute(draft.sale!.id, date)
              .then(saved => {
                draft.setSale(saved);
                setDeliveryError(null);
                setChangingDelivery(false);
              })
              .catch((caught: unknown) => {
                setDeliveryError(saleErrorKey(caught, 'saleLineFailed'));
                setChangingDelivery(false);
              });
          }}
        />
      ) : null}
      {shownCustomerId && !saleId && !draft.sale && !draft.loading ? (
        <DeliveryDateModal
          onSelect={setDeliveryDate}
          onClose={() => setParams({})}
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
        onConfirm={updated => {
          const current = updated ?? draft.sale;
          if (current?.status === 'CONFIRMED') {
            allowLeave.current = true;
            navigate('/day-sales');
            return;
          }
          void confirmation.confirm(current).then(saved => {
            if (saved) {
              navigate('/sales-day');
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
  const [session, setSession] = useState<Session | null>(() => container.sessionStore.read());

  async function signOut() {
    try {
      await container.logout.execute();
    } finally {
      setSession(null);
    }
  }

  return (
    <NavigationHistory>
    <div className="shell">
      <div className="shell-head">
      <header className="topbar">
        <Link to={session ? '/sales-day' : '/login'} aria-label={t('home')}>
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
      <main>
        <Routes>
          <Route
            path="/login"
            element={
              session ? (
                <Navigate to="/sales-day" replace />
              ) : (
                <LoginView login={container.login} onLoggedIn={setSession} />
              )
            }
          />
          <Route path="/" element={<Navigate to={session ? '/sales-day' : '/login'} replace />} />
          <Route
            path="/sales-day"
            element={
              session ? (
                <SalesDayHome
                  sellerId={session.user.id}
                  getCurrentSalesDay={container.getCurrentSalesDay}
                  listRecentSalesDays={container.listRecentSalesDays}
                  openSalesDay={container.openSalesDay}
                  closeSalesDay={container.closeSalesDay}
                  reopenSalesDay={container.reopenSalesDay}
                />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/customers"
            element={
              session ? (
                <CustomerList createCustomer={container.createCustomer} />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/delivery-sales"
            element={session ? <DeliverySalesPage container={container} sellerId={session.user.id} /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/day-sales/:salesDayId?"
            element={session ? <DaySalesPage container={container} sellerId={session.user.id} /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/sales"
            element={
              session ? <SaleSearch container={container} sellerId={session.user.id} /> : <Navigate to="/login" replace />
            }
          />
          <Route
            path="/load-sheets"
            element={session ? <LoadSheetList listLoadSheet={container.listLoadSheet} /> : <Navigate to="/login" replace />}
          />
          <Route path="/invoices/:salesDayId" element={<InvoiceListRedirect />} />
          <Route
            path="/invoices/:salesDayId/:saleId"
            element={
              session ? (
                <InvoicePreview generateInvoice={container.generateInvoice} printInvoices={container.printInvoices} />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route path="*" element={<Navigate to={session ? '/sales-day' : '/login'} replace />} />
        </Routes>
      </main>
    </div>
    </NavigationHistory>
  );
}

