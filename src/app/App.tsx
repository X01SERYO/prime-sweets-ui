import { Link, Navigate, Route, Routes } from 'react-router';
import type { AppContainer } from '@/app/composition';
import { CustomerList, DaySalesList, InvoiceList, LoadSheetList } from '@/app/lists/DummyLists';
import { ProductSearchView } from '@/modules/catalog/adapters/ui/views/ProductSearchView';
import { useLocale } from '@/shared/i18n/useLocale';

interface AppProps {
  container: AppContainer;
}

export function App({ container }: AppProps) {
  const { t, toggleLocale, locale } = useLocale();

  return (
    <div className="shell">
      <header className="topbar">
        <img className="shell-logo" src="/logo.webp" alt="Dulcería La Principal" />
        <button type="button" className="lang" aria-label={t('languageLabel')} onClick={toggleLocale}>
          <span className={locale === 'es' ? 'lang-current' : undefined}>ES</span>
          {' | '}
          <span className={locale === 'en' ? 'lang-current' : undefined}>EN</span>
        </button>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Navigate to="/sales-day" replace />} />
          <Route path="/sales-day" element={<SalesDayHome />} />
          <Route path="/customers" element={<CustomerList />} />
          <Route path="/day-sales" element={<DaySalesList />} />
          <Route path="/sales" element={<ProductSearchView searchProducts={container.searchProducts} />} />
          <Route path="/load-sheets" element={<LoadSheetList />} />
          <Route path="/invoices" element={<InvoiceList />} />
          <Route path="*" element={<Navigate to="/sales-day" replace />} />
        </Routes>
        <p className="m">
          {t('api')} <code>{container.apiBaseUrl}</code>
        </p>
      </main>
    </div>
  );
}

function SalesDayHome() {
  const { t } = useLocale();
  return (
    <section className="stack">
      <h1>{t('salesDay')}</h1>
      <Link className="btn" to="/customers">
        {t('customers')}
      </Link>
      <Link className="btn btn-secondary" to="/day-sales">
        {t('daySales')}
      </Link>
      <Link className="btn btn-secondary" to="/sales">
        {t('sale')}
      </Link>
      <button type="button" className="btn btn-secondary" disabled>
        {t('closeDay')}
      </button>
      <p className="m">{t('closeLater')}</p>
      <p className="m">{t('loadLater')}</p>
      <div className="row">
        <Link className="btn btn-secondary" to="/load-sheets">
          {t('loadSheet')}
        </Link>
        <Link className="btn btn-secondary" to="/invoices">
          {t('invoices')}
        </Link>
      </div>
    </section>
  );
}

