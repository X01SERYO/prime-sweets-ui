import { useState } from 'react';
import { Link } from 'react-router';
import { useCloseSalesDay } from '@/modules/sales-day/adapters/ui/hooks/useCloseSalesDay';
import { useCurrentSalesDay } from '@/modules/sales-day/adapters/ui/hooks/useCurrentSalesDay';
import { useOpenSalesDay } from '@/modules/sales-day/adapters/ui/hooks/useOpenSalesDay';
import { useReopenSalesDay } from '@/modules/sales-day/adapters/ui/hooks/useReopenSalesDay';
import type { CloseSalesDayUseCase } from '@/modules/sales-day/application/use-cases/closeSalesDay.useCase';
import type { GetCurrentSalesDayUseCase } from '@/modules/sales-day/application/use-cases/getCurrentSalesDay.useCase';
import type { OpenSalesDayUseCase } from '@/modules/sales-day/application/use-cases/openSalesDay.useCase';
import type { ReopenSalesDayUseCase } from '@/modules/sales-day/application/use-cases/reopenSalesDay.useCase';
import { useLocale } from '@/shared/i18n/useLocale';

interface SalesDayHomeProps {
  sellerId: string;
  getCurrentSalesDay: GetCurrentSalesDayUseCase;
  openSalesDay: OpenSalesDayUseCase;
  closeSalesDay: CloseSalesDayUseCase;
  reopenSalesDay: ReopenSalesDayUseCase;
}

export function SalesDayHome({ sellerId, getCurrentSalesDay, openSalesDay, closeSalesDay, reopenSalesDay }: SalesDayHomeProps) {
  const { t } = useLocale();
  const current = useCurrentSalesDay(sellerId, getCurrentSalesDay);
  const openingDay = useOpenSalesDay(sellerId, openSalesDay);
  const closingDay = useCloseSalesDay(closeSalesDay);
  const reopeningDay = useReopenSalesDay(reopenSalesDay);
  const [pending, setPending] = useState<'close' | 'reopen' | null>(null);
  const errorKey = reopeningDay.errorKey ?? closingDay.errorKey ?? openingDay.errorKey ?? current.errorKey;
  const closed = current.salesDay?.status === 'CLOSED';

  async function open() {
    const day = await openingDay.open();
    if (day) {
      current.show(day);
    }
  }

  async function confirmPending() {
    if (!current.salesDay || !pending) {
      return;
    }
    const day =
      pending === 'close' ? await closingDay.close(current.salesDay.id) : await reopeningDay.reopen(current.salesDay.id);
    if (day) {
      current.show(day);
      setPending(null);
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
      {current.salesDay?.status === 'OPEN' ? (
        <button className="btn btn-secondary" type="button" onClick={() => setPending('close')}>
          {t('closeDay')}
        </button>
      ) : null}
      {closed ? (
        <button className="btn btn-secondary" type="button" onClick={() => setPending('reopen')}>
          {t('reopenDay')}
        </button>
      ) : null}
      {pending ? (
        <form
          className="card"
          onSubmit={event => {
            event.preventDefault();
            void confirmPending();
          }}
        >
          <p>{pending === 'close' ? t('confirmClose') : t('confirmReopen')}</p>
          <div className="row">
            <button className="btn" type="submit" disabled={closingDay.closing || reopeningDay.reopening}>
              {closingDay.closing ? t('closingDay') : reopeningDay.reopening ? t('reopeningDay') : t('confirmAction')}
            </button>
            <button className="btn btn-secondary" type="button" onClick={() => setPending(null)}>
              {t('cancelAction')}
            </button>
          </div>
        </form>
      ) : null}
      <p className="m">{t('loadLater')}</p>
      <div className="row">
        {closed ? (
          <Link className="btn btn-secondary" to="/load-sheets">
            {t('loadSheet')}
          </Link>
        ) : (
          <button className="btn btn-secondary" type="button" disabled>
            {t('loadSheet')}
          </button>
        )}
        {closed ? (
          <Link className="btn btn-secondary" to="/invoices">
            {t('invoices')}
          </Link>
        ) : (
          <button className="btn btn-secondary" type="button" disabled>
            {t('invoices')}
          </button>
        )}
      </div>
    </section>
  );
}
