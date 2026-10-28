import { useState } from 'react';
import { Navigate, Route, Routes, useSearchParams } from 'react-router';
import { SelectedCustomer } from '@/app/SelectedCustomer';
import type { AppContainer } from '@/app/composition';
import { CustomerList } from '@/modules/customers/adapters/ui/views/CustomerList';
import { InvoiceList } from '@/modules/fulfillment-output/adapters/ui/views/InvoiceList';
import { LoadSheetList } from '@/modules/fulfillment-output/adapters/ui/views/LoadSheetList';
import { useConfirmSale } from '@/modules/sales/adapters/ui/hooks/useConfirmSale';
import { useDraftSale } from '@/modules/sales/adapters/ui/hooks/useDraftSale';
import { useSaleMutations } from '@/modules/sales/adapters/ui/hooks/useSaleMutations';
import { DaySalesList } from '@/modules/sales/adapters/ui/views/DaySalesList';
import { SaleLines } from '@/modules/sales/adapters/ui/views/SaleLines';
import { ProductSearchView } from '@/modules/catalog/adapters/ui/views/ProductSearchView';
import { LoginView } from '@/modules/identity/adapters/ui/views/LoginView';
import { SalesDayHome } from '@/modules/sales-day/adapters/ui/views/SalesDayHome';
import type { Session } from '@/modules/identity/domain/models/session';
import { useLocale } from '@/shared/i18n/useLocale';

interface AppProps {
  container: AppContainer;
}

function SaleSearch({ container, sellerId }: { container: AppContainer; sellerId: string }) {
  const [params] = useSearchParams();
  const customerId = params.get('customerId');
  const draft = useDraftSale(sellerId, customerId, container.getCurrentSalesDay, container.listDraftSales, container.createDraftSale);
  const confirmation = useConfirmSale(container.confirmSale, draft.setSale);
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
      <SelectedCustomer customerId={customerId} getCustomer={container.getCustomer} />
      {draft.sale?.status !== 'CONFIRMED' ? (
        <ProductSearchView
          searchProducts={container.searchProducts}
          selecting={lines.busy || confirmation.confirming}
          onSelect={productId => void lines.add(productId)}
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
        onConfirm={() => void confirmation.confirm(draft.sale)}
        onQuantity={(productId, quantity) => void lines.changeQuantity(productId, quantity)}
        onName={(productId, itemName) => void lines.changeName(productId, itemName)}
        onRemove={productId => void lines.remove(productId)}
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
        <img className="shell-logo" src="/logo.webp" alt="Dulcería La Principal" />
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
                <CustomerList searchCustomers={container.searchCustomers} createCustomer={container.createCustomer} />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route path="/day-sales" element={session ? <DaySalesList /> : <Navigate to="/login" replace />} />
          <Route
            path="/sales"
            element={
              session ? <SaleSearch container={container} sellerId={session.user.id} /> : <Navigate to="/login" replace />
            }
          />
          <Route path="/load-sheets" element={session ? <LoadSheetList /> : <Navigate to="/login" replace />} />
          <Route path="/invoices" element={session ? <InvoiceList /> : <Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to={session ? '/sales-day' : '/login'} replace />} />
        </Routes>
        <p className="m">
          {t('api')} <code>{container.apiBaseUrl}</code>
        </p>
      </main>
    </div>
  );
}

