import { ClipboardList, Plus, Truck } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { useDaySummary, useWeekSaleCounts } from '@/modules/sales/adapters/ui/hooks/useDaySummary';
import type { ListSalesByDeliveryDateUseCase } from '@/modules/sales/application/use-cases/listSalesByDeliveryDate.useCase';
import { businessToday, nextWeek, previousWeek, weekDeliveryDays } from '@/modules/sales/domain/deliveryDays';
import type { DaySaleModel, DaySaleStatus } from '@/modules/sales/domain/models/daySale';
import { formatCurrency } from '@/shared/domain/money';
import { useLocale } from '@/shared/i18n/useLocale';
import type { MessageKey } from '@/shared/i18n/messages';
import { StatusMessage } from '@/shared/ui/StatusMessage';
import './weekHome.css';

interface WeekHomeProps {
  listSales: ListSalesByDeliveryDateUseCase;
}

type SaleFilter = 'all' | DaySaleStatus;

const STATUS_KEY: Record<DaySaleStatus, MessageKey> = {
  DRAFT: 'statusDraft',
  CONFIRMED: 'statusConfirmed',
  VOIDED: 'statusVoided'
};

export function WeekHome({ listSales }: WeekHomeProps) {
  const { t, locale } = useLocale();
  const [params, setParams] = useSearchParams();
  const today = businessToday();
  const requested = params.get('deliveryDate');
  const selected = requested && /^\d{4}-\d{2}-\d{2}$/.test(requested) ? requested : today;
  const days = weekDeliveryDays(selected);
  const { summary, sales, loading, failed } = useDaySummary(selected, listSales);
  const counts = useWeekSaleCounts(days.map(day => day.date), listSales);
  const earlier = previousWeek(selected);
  const later = nextWeek(selected, today);
  const [filter, setFilter] = useState<SaleFilter>('all');
  const [query, setQuery] = useState('');

  function select(date: string) {
    setFilter('all');
    setQuery('');
    setParams({ deliveryDate: date });
  }

  const first = days[0];
  const last = days[days.length - 1];
  const range =
    first && last
      ? `${shortMonthDay(first.date, locale)} – ${shortMonthDay(last.date, locale)}`
      : '';

  const rows = useMemo(() => {
    const order: Record<DaySaleStatus, number> = { DRAFT: 0, CONFIRMED: 1, VOIDED: 2 };
    const needle = query.trim().toLocaleLowerCase();
    return sales
      .filter(sale => (filter === 'all' || sale.status === filter) && sale.customerName.toLocaleLowerCase().includes(needle))
      .sort((a, b) => order[a.status] - order[b.status]);
  }, [filter, query, sales]);

  const firstDraft = sales.find(sale => sale.status === 'DRAFT');
  const confirmedUnits = sales.filter(sale => sale.status === 'CONFIRMED').reduce((sum, sale) => sum + sale.quantity, 0);

  return (
    <section className="wholesale-home">
      <div className="wholesale-week-head">
        <h2>{range}</h2>
        <button className="wholesale-link" type="button" onClick={() => select(today)}>
          {t('goToToday')}
        </button>
        <button className="wholesale-icon" type="button" aria-label={t('previousWeek')} disabled={!earlier} onClick={() => earlier && select(earlier)}>
          ‹
        </button>
        <button className="wholesale-icon" type="button" aria-label={t('nextWeek')} disabled={!later} onClick={() => later && select(later)}>
          ›
        </button>
      </div>
      <div className="wholesale-days" role="group" aria-label={t('weekDays')}>
        {days.map(day => {
          const count = counts[day.date];
          return (
            <button
              key={day.date}
              className={day.date === today ? 'wholesale-day is-today' : 'wholesale-day'}
              type="button"
              aria-pressed={day.date === selected}
              onClick={() => select(day.date)}
            >
              <small>
                {weekdayName(day.date, locale)}
                {day.date === today ? <span className="wholesale-today"> · {t('today')}</span> : null}
              </small>
              <b>{day.dayOfMonth}</b>
              <span className={count ? 'wholesale-count' : 'wholesale-count is-zero'}>
                {count === 1 ? t('daySaleCountOne') : count ? t('daySaleCount').replace('{count}', String(count)) : '–'}
              </span>
            </button>
          );
        })}
      </div>

      <div className="wholesale-title">
        <h1>{longDate(selected, locale)}</h1>
        <Link className="btn wholesale-new" to={`/sales?deliveryDate=${encodeURIComponent(selected)}`}>
          <Plus aria-hidden="true" strokeWidth={2.4} />
          {t('newSale')}
        </Link>
      </div>

      {firstDraft ? (
        <div className="wholesale-alert">
          <p>{summary && summary.drafts > 1 ? t('draftAlertMany').replace('{count}', String(summary.drafts)) : t('draftAlertOne')}</p>
          <Link to={`/sales?deliveryDate=${encodeURIComponent(selected)}&saleId=${encodeURIComponent(firstDraft.id)}`}>
            {t('continueSale')}
          </Link>
        </div>
      ) : null}

      {loading ? <StatusMessage tone="info">{t('daySummaryLoading')}</StatusMessage> : null}
      {failed ? <StatusMessage tone="error">{t('daySummaryFailed')}</StatusMessage> : null}

      <div className="wholesale-grid">
        <section className="wholesale-panel" aria-label={t('daySales')}>
          <div className="wholesale-tools">
            <div className="wholesale-chips" role="group" aria-label={t('status')}>
              <FilterChip pressed={filter === 'all'} label={t('allSales')} count={sales.length} onClick={() => setFilter('all')} />
              <FilterChip pressed={filter === 'DRAFT'} label={t('draftCount')} count={summary?.drafts ?? 0} onClick={() => setFilter('DRAFT')} />
              <FilterChip pressed={filter === 'CONFIRMED'} label={t('confirmedCount')} count={summary?.confirmed ?? 0} onClick={() => setFilter('CONFIRMED')} />
              <FilterChip pressed={filter === 'VOIDED'} label={t('voidedCount')} count={summary?.voided ?? 0} onClick={() => setFilter('VOIDED')} />
            </div>
            <input
              className="wholesale-search"
              type="search"
              value={query}
              placeholder={t('searchSaleCustomer')}
              aria-label={t('searchSaleCustomer')}
              onChange={event => setQuery(event.target.value)}
            />
          </div>
          {rows.length === 0 && !loading ? (
            <div className="wholesale-empty">
              <h3>{sales.length ? t('noSalesFilter') : t('noSalesDay')}</h3>
            </div>
          ) : (
            <ul className="wholesale-list">
              {rows.map(sale => (
                <SaleRow key={sale.id} sale={sale} deliveryDate={selected} />
              ))}
            </ul>
          )}
        </section>

        <aside className="wholesale-aside" aria-label={t('confirmedDayTotal')}>
          <div className="wholesale-panel wholesale-summary">
            <div className="wholesale-label">{t('confirmedDayTotal')}</div>
            <div className="wholesale-total">{formatCurrency(summary?.confirmedTotal ?? 0)}</div>
            <div className="wholesale-stats">
              <div><b>{summary?.confirmed ?? 0}</b><span>{t('confirmedCount')}</span></div>
              <div><b>{summary?.drafts ?? 0}</b><span>{t('draftCount')}</span></div>
              <div><b>{summary?.voided ?? 0}</b><span>{t('voidedCount')}</span></div>
            </div>
          </div>
          <div className="wholesale-shortcuts">
            <Link className="wholesale-shortcut" to={`/delivery-sales?deliveryDate=${encodeURIComponent(selected)}`}>
              <Truck aria-hidden="true" strokeWidth={2} />
              <span>
                {t('salesOfDay')}
                <small>{summary?.confirmed ? t('toDeliver').replace('{count}', String(summary.confirmed)) : t('nothingToDeliver')}</small>
              </span>
            </Link>
            <Link className="wholesale-shortcut" to={`/load-sheets?deliveryDate=${encodeURIComponent(selected)}`}>
              <ClipboardList aria-hidden="true" strokeWidth={2} />
              <span>
                {t('loadSheet')}
                <small>{confirmedUnits ? t('unitsToLoad').replace('{count}', String(confirmedUnits)) : t('nothingToLoad')}</small>
              </span>
            </Link>
          </div>
        </aside>
      </div>

      <Link className="btn wholesale-fab" to={`/sales?deliveryDate=${encodeURIComponent(selected)}`}>
        <Plus aria-hidden="true" strokeWidth={2.4} />
        {t('newSale')}
      </Link>
    </section>
  );
}

function FilterChip({ pressed, label, count, onClick }: { pressed: boolean; label: string; count: number; onClick: () => void }) {
  return (
    <button className="wholesale-chip" type="button" aria-pressed={pressed} onClick={onClick}>
      {label}<b>{count}</b>
    </button>
  );
}

function SaleRow({ sale, deliveryDate }: { sale: DaySaleModel; deliveryDate: string }) {
  const { t } = useLocale();
  return (
    <li className={sale.status === 'VOIDED' ? 'wholesale-sale is-void' : 'wholesale-sale'}>
      <div>
        <div className="wholesale-who">{sale.customerName}</div>
        <div className="wholesale-meta">
          <span className={`wholesale-status is-${sale.status.toLowerCase()}`}>{t(STATUS_KEY[sale.status])}</span>
          {t('saleSummary').replace('{products}', String(sale.productCount)).replace('{units}', String(sale.quantity))}
        </div>
      </div>
      <div className="wholesale-amount">{formatCurrency(sale.total)}</div>
      <Link
        className={sale.status === 'DRAFT' ? 'wholesale-row-btn is-main' : 'wholesale-row-btn'}
        to={`/sales?deliveryDate=${encodeURIComponent(deliveryDate)}&saleId=${encodeURIComponent(sale.id)}`}
      >
        {sale.status === 'DRAFT' ? t('continueSale') : t('viewSale')}
      </Link>
    </li>
  );
}

function weekdayName(value: string, locale: string): string {
  const date = parse(value);
  return new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'es-CO', { weekday: 'short' }).format(date);
}

function shortMonthDay(value: string, locale: string): string {
  const date = parse(value);
  return new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'es-CO', { day: 'numeric', month: 'short' }).format(date);
}

function longDate(value: string, locale: string): string {
  const date = parse(value);
  const formatted = new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  }).format(date);
  return formatted.charAt(0).toLocaleUpperCase(locale === 'en' ? 'en-US' : 'es-CO') + formatted.slice(1);
}

function parse(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, (month ?? 1) - 1, day);
}
