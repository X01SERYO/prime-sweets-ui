import { Link } from 'react-router';
import { useCurrentSalesDay } from '@/modules/sales-day/adapters/ui/hooks/useCurrentSalesDay';
import type { GetCurrentSalesDayUseCase } from '@/modules/sales-day/application/use-cases/getCurrentSalesDay.useCase';
import { useLocale } from '@/shared/i18n/useLocale';

interface SalesDayHomeProps {
  sellerId: string;
  getCurrentSalesDay: GetCurrentSalesDayUseCase;
}

export function SalesDayHome({ sellerId, getCurrentSalesDay }: SalesDayHomeProps) {
  const { t } = useLocale();
  const { salesDay, loading, errorKey } = useCurrentSalesDay(sellerId, getCurrentSalesDay);

  return (
    <section className="stack">
      <h1>{t('salesDay')}</h1>
      {loading ? <p className="m">{t('salesDayLoading')}</p> : null}
      {errorKey ? <p role="alert">{t(errorKey)}</p> : null}
      {!loading && !errorKey && !salesDay ? <p className="m">{t('salesDayMissing')}</p> : null}
      {salesDay ? (
        <p className="m">
          {salesDay.date}
          {' · '}
          {salesDay.status === 'OPEN' ? t('salesDayOpen') : t('salesDayClosed')}
        </p>
      ) : null}
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
