import { Link } from 'react-router';
import { useCurrentSalesDay } from '@/modules/sales-day/adapters/ui/hooks/useCurrentSalesDay';
import { useOpenSalesDay } from '@/modules/sales-day/adapters/ui/hooks/useOpenSalesDay';
import type { GetCurrentSalesDayUseCase } from '@/modules/sales-day/application/use-cases/getCurrentSalesDay.useCase';
import type { OpenSalesDayUseCase } from '@/modules/sales-day/application/use-cases/openSalesDay.useCase';
import { useLocale } from '@/shared/i18n/useLocale';

interface SalesDayHomeProps {
  sellerId: string;
  getCurrentSalesDay: GetCurrentSalesDayUseCase;
  openSalesDay: OpenSalesDayUseCase;
}

export function SalesDayHome({ sellerId, getCurrentSalesDay, openSalesDay }: SalesDayHomeProps) {
  const { t } = useLocale();
  const current = useCurrentSalesDay(sellerId, getCurrentSalesDay);
  const openingDay = useOpenSalesDay(sellerId, openSalesDay);
  const errorKey = openingDay.errorKey ?? current.errorKey;

  async function open() {
    const day = await openingDay.open();
    if (day) {
      current.show(day);
    }
  }

  return (
    <section className="stack">
      <h1>{t('salesDay')}</h1>
      {current.loading ? <p className="m">{t('salesDayLoading')}</p> : null}
      {errorKey ? <p role="alert">{t(errorKey)}</p> : null}
      {!current.loading && !current.salesDay ? (
        <button className="btn" type="button" disabled={openingDay.opening} onClick={() => void open()}>
          {openingDay.opening ? t('openingDay') : t('openDay')}
        </button>
      ) : null}
      {!current.loading && !errorKey && !current.salesDay ? <p className="m">{t('salesDayMissing')}</p> : null}
      {current.salesDay ? (
        <p className="m">
          {current.salesDay.date}
          {' · '}
          {current.salesDay.status === 'OPEN' ? t('salesDayOpen') : t('salesDayClosed')}
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
