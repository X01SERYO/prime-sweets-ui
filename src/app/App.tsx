import { useState } from 'react';
import { Navigate, Route, Routes } from 'react-router';
import type { AppContainer } from '@/app/composition';
import { CustomerList } from '@/modules/customers/adapters/ui/views/CustomerList';
import { InvoiceList } from '@/modules/fulfillment-output/adapters/ui/views/InvoiceList';
import { LoadSheetList } from '@/modules/fulfillment-output/adapters/ui/views/LoadSheetList';
import { DaySalesList } from '@/modules/sales/adapters/ui/views/DaySalesList';
import { ProductSearchView } from '@/modules/catalog/adapters/ui/views/ProductSearchView';
import { LoginView } from '@/modules/identity/adapters/ui/views/LoginView';
import { SalesDayHome } from '@/modules/sales-day/adapters/ui/views/SalesDayHome';
import type { Session } from '@/modules/identity/domain/models/session';
import { useLocale } from '@/shared/i18n/useLocale';

interface AppProps {
  container: AppContainer;
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
          <Route path="/customers" element={session ? <CustomerList /> : <Navigate to="/login" replace />} />
          <Route path="/day-sales" element={session ? <DaySalesList /> : <Navigate to="/login" replace />} />
          <Route
            path="/sales"
            element={
              session ? <ProductSearchView searchProducts={container.searchProducts} /> : <Navigate to="/login" replace />
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

