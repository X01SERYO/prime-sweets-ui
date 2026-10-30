import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, Route, Routes, useBlocker, useNavigate, useSearchParams } from 'react-router';
import { SelectedCustomer } from '@/app/SelectedCustomer';
import type { AppContainer } from '@/app/composition';
import { CustomerList } from '@/modules/customers/adapters/ui/views/CustomerList';
import { SaleCustomerChoice } from '@/modules/customers/adapters/ui/views/SaleCustomerChoice';
import { InvoiceList } from '@/modules/fulfillment-output/adapters/ui/views/InvoiceList';
import { InvoicePreview } from '@/modules/fulfillment-output/adapters/ui/views/InvoicePreview';
import { LoadSheetList } from '@/modules/fulfillment-output/adapters/ui/views/LoadSheetList';
import { useConfirmSale } from '@/modules/sales/adapters/ui/hooks/useConfirmSale';
import { useDraftSale } from '@/modules/sales/adapters/ui/hooks/useDraftSale';
import { useSaleMutations } from '@/modules/sales/adapters/ui/hooks/useSaleMutations';
import { DaySalesList } from '@/modules/sales/adapters/ui/views/DaySalesList';
import { SaleLines, type PendingLine } from '@/modules/sales/adapters/ui/views/SaleLines';
import { ProductSearchView } from '@/modules/catalog/adapters/ui/views/ProductSearchView';
import { LoginView } from '@/modules/identity/adapters/ui/views/LoginView';
import { SalesDayHome } from '@/modules/sales-day/adapters/ui/views/SalesDayHome';
import type { Session } from '@/modules/identity/domain/models/session';
import { useLocale } from '@/shared/i18n/useLocale';

interface AppProps {
  container: AppContainer;
}

function SaleSearch({ container, sellerId }: { container: AppContainer; sellerId: string }) {
  const { t } = useLocale();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const customerId = params.get('customerId');
  const saleId = params.get('saleId');
  const [pending, setPending] = useState<PendingLine | null>(null);
  const [editingLine, setEditingLine] = useState(false);
  const [editNotice, setEditNotice] = useState(false);
  const allowLeave = useRef(false);
  const blocker = useBlocker(() => editingLine && !allowLeave.current);
  const draft = useDraftSale(
    sellerId,
    customerId,
    saleId,
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
    <>
      <h1>{t('sale')}</h1>
      {!shownCustomerId && !draft.loading ? (
        <SaleCustomerChoice searchCustomers={container.searchCustomers} onSelect={id => setParams({ customerId: id })} />
      ) : (
        <SelectedCustomer customerId={shownCustomerId} getCustomer={container.getCustomer} />
      )}
      {shownCustomerId && canEditLines ? (
        <ProductSearchView
          searchProducts={container.searchProducts}
          selecting={lines.busy || confirmation.confirming}
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
        onAcceptPending={(name, quantity) =>
          pending ? lines.accept(pending.productId, quantity, name) : Promise.resolve(null)
        }
        onCancelPending={() => setPending(null)}
        onEditingChange={setEditingLine}
        editNotice={editNotice}
        onEditBlocked={() => setEditNotice(true)}
        onDismissEditNotice={() => setEditNotice(false)}
        onRemove={productId => void lines.remove(productId)}
        onQuantity={(productId, quantity) => lines.changeQuantity(productId, quantity)}
        onName={(productId, itemName) => lines.changeName(productId, itemName) ?? Promise.resolve(null)}
      />
    </>
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
    <div className="shell">
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
            path="/day-sales"
            element={
              session ? (
                <DaySalesList
                  sellerId={session.user.id}
                  getCurrentSalesDay={container.getCurrentSalesDay}
                  listDaySales={container.listDaySales}
                  voidSale={container.voidSale}
                />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/sales"
            element={
              session ? <SaleSearch container={container} sellerId={session.user.id} /> : <Navigate to="/login" replace />
            }
          />
          <Route
            path="/load-sheets/:salesDayId"
            element={session ? <LoadSheetList listLoadSheet={container.listLoadSheet} /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/invoices/:salesDayId"
            element={
              session ? (
                <InvoiceList listInvoices={container.listInvoices} printInvoices={container.printInvoices} />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
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
  );
}

