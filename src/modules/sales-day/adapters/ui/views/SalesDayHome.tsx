import { useState } from 'react';
import { Link } from 'react-router';
import { useCloseSalesDay } from '@/modules/sales-day/adapters/ui/hooks/useCloseSalesDay';
import { useCurrentSalesDay } from '@/modules/sales-day/adapters/ui/hooks/useCurrentSalesDay';
import { useOpenSalesDay } from '@/modules/sales-day/adapters/ui/hooks/useOpenSalesDay';
import { useRecentSalesDays } from '@/modules/sales-day/adapters/ui/hooks/useRecentSalesDays';
import { useReopenSalesDay } from '@/modules/sales-day/adapters/ui/hooks/useReopenSalesDay';
import type { CloseSalesDayUseCase } from '@/modules/sales-day/application/use-cases/closeSalesDay.useCase';
import type { GetCurrentSalesDayUseCase } from '@/modules/sales-day/application/use-cases/getCurrentSalesDay.useCase';
import type { ListRecentSalesDaysUseCase } from '@/modules/sales-day/application/use-cases/listRecentSalesDays.useCase';
import type { OpenSalesDayUseCase } from '@/modules/sales-day/application/use-cases/openSalesDay.useCase';
import type { ReopenSalesDayUseCase } from '@/modules/sales-day/application/use-cases/reopenSalesDay.useCase';
import type { SalesDayModel } from '@/modules/sales-day/domain/models/salesDay';
import { useLocale } from '@/shared/i18n/useLocale';
import { ScreenTitle } from '@/shared/ui/BackButton';
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog';

const openSalesDayKey = 'prime-sweets.open-sales-day';

function readOpenSalesDay(): string | null {
  try {
    return sessionStorage.getItem(openSalesDayKey);
  } catch {
    return null;
  }
}

function rememberOpenSalesDay(id: string | null) {
  try {
    if (id) {
      sessionStorage.setItem(openSalesDayKey, id);
      return;
    }
    sessionStorage.removeItem(openSalesDayKey);
  } catch {
    // La lista sigue funcionando en esta visita.
  }
}

interface SalesDayHomeProps {
  sellerId: string;
  getCurrentSalesDay: GetCurrentSalesDayUseCase;
  listRecentSalesDays: ListRecentSalesDaysUseCase;
  openSalesDay: OpenSalesDayUseCase;
  closeSalesDay: CloseSalesDayUseCase;
  reopenSalesDay: ReopenSalesDayUseCase;
}

export function SalesDayHome({
  sellerId,
  getCurrentSalesDay,
  listRecentSalesDays,
  openSalesDay,
  closeSalesDay,
  reopenSalesDay
}: SalesDayHomeProps) {
  const { t, locale } = useLocale();
  const current = useCurrentSalesDay(sellerId, getCurrentSalesDay);
  const recent = useRecentSalesDays(sellerId, listRecentSalesDays);
  const openingDay = useOpenSalesDay(sellerId, openSalesDay);
  const closingDay = useCloseSalesDay(closeSalesDay);
  const reopeningDay = useReopenSalesDay(reopenSalesDay);
  const [pending, setPending] = useState<{ action: 'close' | 'reopen'; salesDayId: string } | null>(null);
  const [openId, setOpenId] = useState<string | null>(readOpenSalesDay);
  const actionError = pending?.action === 'close' ? closingDay.errorKey : pending?.action === 'reopen' ? reopeningDay.errorKey : null;
  const errorKey = pending
    ? (openingDay.errorKey ?? current.errorKey ?? recent.errorKey)
    : (reopeningDay.errorKey ?? closingDay.errorKey ?? openingDay.errorKey ?? current.errorKey ?? recent.errorKey);
  const days = visibleDays(recent.days, current.salesDay);

  async function open() {
    const day = await openingDay.open();
    if (day) {
      current.show(day);
      recent.reload();
    }
  }

  async function confirmPending() {
    if (!pending) {
      return;
    }
    const day =
      pending.action === 'close' ? await closingDay.close(pending.salesDayId) : await reopeningDay.reopen(pending.salesDayId);
    if (day) {
      if (current.salesDay?.id === day.id) {
        current.show(day);
      }
      setPending(null);
      recent.reload();
    }
  }

  return (
    <section className="stack">
      <ScreenTitle>{t('salesDay')}</ScreenTitle>
      {current.loading || recent.loading ? <p className="m">{recent.loading ? t('recentSalesDaysLoading') : t('salesDayLoading')}</p> : null}
      {errorKey ? <p role="alert">{t(errorKey)}</p> : null}
      {!current.loading && !current.salesDay ? (
        <button className="btn" type="button" disabled={openingDay.opening} onClick={() => void open()}>
          {openingDay.opening ? t('openingDay') : t('openDay')}
        </button>
      ) : null}
      {!current.loading && !recent.loading && days.length === 0 && !errorKey ? <p className="m">{t('recentSalesDaysEmpty')}</p> : null}
      {days.length > 0 ? (
        <>
          <h2>{t('recentSalesDays')}</h2>
          <ul className="sales-day-list">
            {days.map(day => {
              const isToday = current.salesDay?.id === day.id;
              const expanded = openId === day.id;
              const pastOpen = !isToday && day.status === 'OPEN';
              const showSheet = !pastOpen && (!isToday || day.status === 'CLOSED');
              const showNewSale = isToday && day.status === 'OPEN';
              const showDaySales = !pastOpen;
              const showClose = day.status === 'OPEN';
              const showReopen = isToday && day.status === 'CLOSED';
              const actionCount = [showSheet, showNewSale, showDaySales, showClose, showReopen].filter(Boolean).length;
              return (
                <li key={day.id} className={isToday ? 'sales-day-card is-today' : 'sales-day-card'}>
                  <button
                    className="sales-day-summary"
                    type="button"
                    aria-expanded={expanded}
                    aria-label={expanded ? t('hideSalesDay') : t('viewSalesDay')}
                    onClick={() => {
                      const next = expanded ? null : day.id;
                      rememberOpenSalesDay(next);
                      setOpenId(next);
                    }}
                  >
                    <span className="sales-day-date">{formatBusinessDate(day.date, locale)}</span>
                    <span className={day.status === 'OPEN' ? 'tag tag-confirmed' : 'tag tag-voided'}>
                      {day.status === 'OPEN' ? t('salesDayOpen') : t('salesDayClosed')}
                    </span>
                    <span className={expanded ? 'sales-day-toggle open' : 'sales-day-toggle'} aria-hidden="true">
                      <ChevronIcon />
                    </span>
                  </button>
                  {expanded ? (
                    <div className={`sales-day-actions cols-${actionCount}`}>
                      {showSheet ? (
                        <Link className="btn btn-secondary" to={`/load-sheets/${day.id}`}>
                          {t('loadSheet')}
                        </Link>
                      ) : null}
                      {showNewSale ? (
                        <Link className="btn" to="/sales">
                          {t('newSale')}
                        </Link>
                      ) : null}
                      {showDaySales ? (
                        <Link className="btn btn-secondary" to={isToday && day.status === 'OPEN' ? '/day-sales' : `/day-sales/${day.id}`}>
                          {t('daySales')}
                        </Link>
                      ) : null}
                      {showClose ? (
                        <button className="btn btn-secondary" type="button" onClick={() => setPending({ action: 'close', salesDayId: day.id })}>
                          {t('closeDay')}
                        </button>
                      ) : null}
                      {showReopen ? (
                        <button className="btn btn-secondary" type="button" onClick={() => setPending({ action: 'reopen', salesDayId: day.id })}>
                          {t('reopenDay')}
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                  {expanded && isToday && day.status === 'OPEN' ? <p className="m">{t('loadLater')}</p> : null}
                </li>
              );
            })}
          </ul>
        </>
      ) : null}
      {pending ? (
        <ConfirmDialog
          title={pending.action === 'close' ? t('closeDay') : t('reopenDay')}
          message={pending.action === 'close' ? t('confirmClose') : t('confirmReopen')}
          confirmLabel={
            closingDay.closing ? t('closingDay') : reopeningDay.reopening ? t('reopeningDay') : t('confirmAction')
          }
          cancelLabel={t('cancelAction')}
          busy={closingDay.closing || reopeningDay.reopening}
          error={actionError ? t(actionError) : null}
          onConfirm={() => void confirmPending()}
          onCancel={() => setPending(null)}
        />
      ) : null}
    </section>
  );
}

function visibleDays(days: SalesDayModel[], current: SalesDayModel | null): SalesDayModel[] {
  const fresh = days.map(day => (current?.id === day.id ? current : day));
  if (current && !fresh.some(day => day.id === current.id)) {
    return [current, ...fresh];
  }
  return fresh;
}

function ChevronIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M7.4 8.6 12 13.2l4.6-4.6L18 10l-6 6-6-6z" />
    </svg>
  );
}

function formatBusinessDate(value: string, locale: string): string {
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) {
    return value;
  }
  const formatted = new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'es-CO', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(new Date(year, month - 1, day));
  const cleaned = formatted.replace(',', '');
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

