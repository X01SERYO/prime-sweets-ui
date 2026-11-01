import { Link, useSearchParams } from 'react-router';
import { useDaySummary } from '@/modules/sales/adapters/ui/hooks/useDaySummary';
import type { ListSalesByDeliveryDateUseCase } from '@/modules/sales/application/use-cases/listSalesByDeliveryDate.useCase';
import { businessToday, nextWeek, previousWeek, weekDeliveryDays } from '@/modules/sales/domain/deliveryDays';
import { formatCurrency } from '@/shared/domain/money';
import { useLocale } from '@/shared/i18n/useLocale';
interface WeekHomeProps {
  listSales: ListSalesByDeliveryDateUseCase;
}

export function WeekHome({ listSales }: WeekHomeProps) {
  const { t, locale } = useLocale();
  const [params, setParams] = useSearchParams();
  const today = businessToday();
  const requested = params.get('deliveryDate');
  const selected = requested && /^\d{4}-\d{2}-\d{2}$/.test(requested) ? requested : today;
  const days = weekDeliveryDays(selected);
  const summary = useDaySummary(selected, listSales);
  const earlier = previousWeek(selected);
  const later = nextWeek(selected, today);

  function select(date: string) {
    setParams({ deliveryDate: date });
  }

  const first = days[0];
  const last = days[days.length - 1];
  const range =
    first && last
      ? `${weekdayName(first.date, locale)} ${first.dayOfMonth} – ${weekdayName(last.date, locale)} ${last.dayOfMonth}`
      : '';

  return (
    <section className="stack">
      <div className="week-home-actions">
        <button className="btn btn-secondary" type="button">
          {t('products')}
        </button>
        <Link className="btn" to={`/sales?deliveryDate=${encodeURIComponent(today)}`}>
          {t('newSale')}
        </Link>
      </div>
      <div className="week-nav">
        <button className="week-shift" type="button" aria-label={t('previousWeek')} disabled={!earlier} onClick={() => earlier && select(earlier)}>
          ‹
        </button>
        <span className="week-range">{range}</span>
        <button className="week-shift" type="button" aria-label={t('nextWeek')} disabled={!later} onClick={() => later && select(later)}>
          ›
        </button>
      </div>
      <div className="week-days" role="group" aria-label={t('weekDays')}>
        {days.map(day => (
          <button
            key={day.date}
            className={day.date === selected ? 'btn' : 'btn btn-secondary'}
            type="button"
            aria-pressed={day.date === selected}
            onClick={() => select(day.date)}
          >
            <span className="week-day-name">{weekdayName(day.date, locale)}</span>
            <span>{day.dayOfMonth}</span>
          </button>
        ))}
      </div>
      {summary.loading ? <p className="m">{t('daySummaryLoading')}</p> : null}
      {summary.failed ? <p role="alert">{t('daySummaryFailed')}</p> : null}
      {summary.summary ? (
        <ul className="day-summary">
          <li>
            <span>{t('draftCount')}</span>
            <strong>{summary.summary.drafts}</strong>
          </li>
          <li>
            <span>{t('confirmedCount')}</span>
            <strong>{summary.summary.confirmed}</strong>
          </li>
          <li>
            <span>{t('voidedCount')}</span>
            <strong>{summary.summary.voided}</strong>
          </li>
          <li>
            <span>{t('confirmedTotal')}</span>
            <strong>{formatCurrency(summary.summary.confirmedTotal)}</strong>
          </li>
        </ul>
      ) : null}
      <div className="week-shortcuts">
        <Link className="btn btn-secondary" to={`/delivery-sales?deliveryDate=${encodeURIComponent(selected)}`}>
          {t('salesOfDay')}
        </Link>
        <Link className="btn btn-secondary" to={`/load-sheets?deliveryDate=${encodeURIComponent(selected)}`}>
          {t('loadSheet')}
        </Link>
      </div>
    </section>
  );
}

function weekdayName(value: string, locale: string): string {
  const [year, month, day] = value.split('-').map(Number);
  return new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'es-CO', { weekday: 'short' }).format(
    new Date(year, (month ?? 1) - 1, day)
  );
}
