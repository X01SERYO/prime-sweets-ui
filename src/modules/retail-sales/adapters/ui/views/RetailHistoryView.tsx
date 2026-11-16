import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import type { ListRetailDaysUseCase } from '@/modules/retail-sales/application/use-cases/listRetailDays.useCase';
import type { ReviewRetailDaysUseCase } from '@/modules/retail-sales/application/use-cases/reviewRetailDays.useCase';
import { RetailInvalidError } from '@/modules/retail-sales/domain/errors/retailInvalid.error';
import type { RetailDayPage, RetailDayStatus } from '@/modules/retail-sales/domain/models/retailDay';
import { formatCurrency } from '@/shared/domain/money';
import { useLocale } from '@/shared/i18n/useLocale';
import { AppToast } from '@/shared/ui/AppToast';
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog';
import { Pager } from '@/shared/ui/Pager';
import { StatusMessage } from '@/shared/ui/StatusMessage';
import './retail.css';

function bogotaToday(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date());
}

function dayCount(from: string, today: string): number {
  const start = Date.parse(`${from}T00:00:00Z`);
  const end = Date.parse(`${today}T00:00:00Z`);
  return Math.round((end - start) / 86_400_000);
}

export function RetailHistoryView({
  listDays,
  reviewDays
}: {
  listDays: ListRetailDaysUseCase;
  reviewDays: ReviewRetailDaysUseCase;
}) {
  const { t, locale } = useLocale();
  const [params, setParams] = useSearchParams();
  const status: RetailDayStatus = params.get('status') === 'REVIEWED' ? 'REVIEWED' : 'UNREVIEWED';
  const page = Math.max(1, Number(params.get('page')) || 1);
  const pageSize = [10, 20, 30, 40, 50].includes(Number(params.get('pageSize'))) ? Number(params.get('pageSize')) : 10;
  const [pageData, setPageData] = useState<RetailDayPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const today = bogotaToday();

  function writeParams(next: { status?: RetailDayStatus; page?: number; pageSize?: number }) {
    const query = new URLSearchParams(params);
    query.set('status', next.status ?? status);
    query.set('page', String(next.page ?? page));
    query.set('pageSize', String(next.pageSize ?? pageSize));
    setSelected([]);
    setParams(query);
  }

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    void listDays.execute(status, page, pageSize).then(
      found => {
        if (!cancelled) {
          setPageData(found);
          setLoading(false);
        }
      },
      () => {
        if (!cancelled) {
          setPageData(null);
          setError(t('retailHistoryFailed'));
          setLoading(false);
        }
      }
    );
    return () => {
      cancelled = true;
    };
  }, [listDays, page, pageSize, status, t]);

  const items = pageData?.items ?? [];
  const chosen = items.filter(item => selected.includes(item.businessDate));
  const sold = chosen.reduce((sum, item) => sum + item.totalAmount, 0);
  const profit = chosen.reduce((sum, item) => sum + item.totalProfit, 0);
  const allSelected = items.length > 0 && items.every(item => selected.includes(item.businessDate));

  async function closeTill() {
    setBusy(true);
    setError(null);
    try {
      await reviewDays.execute(selected);
      const count = selected.length;
      setToast(`${count} ${t('retailDaysReviewed')}`);
      setConfirming(false);
      setSelected([]);
      const nextPage = items.length === count && page > 1 ? page - 1 : page;
      writeParams({ page: nextPage });
      setPageData(await listDays.execute(status, nextPage, pageSize));
    } catch (caught) {
      setConfirming(false);
      setError(caught instanceof RetailInvalidError && caught.code === 'RETAIL_DAY_ALREADY_REVIEWED' ? t('retailAlreadyReviewed') : t('retailSaveFailed'));
      setPageData(await listDays.execute(status, page, pageSize).catch(() => pageData));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="retail-history">
      <div className="retail-status-switch" role="tablist">
        <button type="button" role="tab" aria-selected={status === 'UNREVIEWED'} className={status === 'UNREVIEWED' ? 'is-active' : undefined} onClick={() => writeParams({ status: 'UNREVIEWED', page: 1 })}>
          {t('retailUnreviewed')}
        </button>
        <button type="button" role="tab" aria-selected={status === 'REVIEWED'} className={status === 'REVIEWED' ? 'is-active' : undefined} onClick={() => writeParams({ status: 'REVIEWED', page: 1 })}>
          {t('retailReviewed')}
        </button>
      </div>
      {loading ? <StatusMessage tone="info">{t('retailLoading')}</StatusMessage> : null}
      {error ? <StatusMessage tone="error">{error}</StatusMessage> : null}
      {!loading && items.length === 0 ? (
        <StatusMessage tone="info">{status === 'REVIEWED' ? t('retailReviewedEmpty') : t('retailHistoryEmpty')}</StatusMessage>
      ) : null}
      {status === 'UNREVIEWED' && items.length > 0 ? (
        <label className="retail-select-page">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={() => setSelected(allSelected ? [] : items.map(item => item.businessDate))}
          />
          {t('retailSelectPage')}
        </label>
      ) : null}
      <ul className="retail-history-list">
        {items.map(item => {
          const ago = dayCount(item.businessDate, today);
          const when = ago === 0 ? t('retailDate') : ago === 1 ? t('retailAgoOne') : `${t('retailAgo')} ${ago} ${t('retailDays')}`.trim();
          const checked = selected.includes(item.businessDate);
          return (
            <li key={item.businessDate}>
              <label className={status === 'REVIEWED' ? 'is-reviewed' : undefined}>
                {status === 'UNREVIEWED' ? (
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => setSelected(current => (checked ? current.filter(date => date !== item.businessDate) : [...current, item.businessDate]))}
                  />
                ) : null}
                <span className="retail-history-when">
                  <strong>
                    {ago === 0 ? `${t('retailDate')} · ` : ''}
                    {formatHeading(item.businessDate, locale)}
                  </strong>
                  <small>{when}</small>
                </span>
                <span className="retail-history-metric">
                  <small>{t('retailTotalSold')}</small>
                  <strong>{formatCurrency(item.totalAmount)}</strong>
                </span>
                <span className="retail-history-metric">
                  <small>{t('retailTotalProfit')}</small>
                  <strong>{formatCurrency(item.totalProfit)}</strong>
                </span>
                {status === 'REVIEWED' && item.reviewedByName ? (
                  <span className="retail-review-meta">
                    <small>{t('retailReviewedBy')}</small>
                    <strong>{item.reviewedByName}</strong>
                  </span>
                ) : null}
                {status === 'REVIEWED' && item.reviewedAt ? (
                  <span className="retail-review-meta">
                    <small>{t('retailReviewedAt')}</small>
                    <strong>{new Date(item.reviewedAt).toLocaleString(locale === 'en' ? 'en' : 'es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</strong>
                  </span>
                ) : null}
              </label>
            </li>
          );
        })}
      </ul>
      {pageData ? (
        <Pager
          page={pageData.page}
          pageSize={pageData.pageSize}
          total={pageData.total}
          onPage={next => writeParams({ page: next })}
          onPageSize={size => writeParams({ page: 1, pageSize: size })}
        />
      ) : null}
      {status === 'UNREVIEWED' && chosen.length > 0 ? (
        <div className="retail-history-bar">
          <span className="retail-history-metric">
            <small>{t('retailProfitShort')}</small>
            <strong>{formatCurrency(profit)}</strong>
          </span>
          <span className="retail-history-metric">
            <small>{t('retailSoldShort')}</small>
            <strong>{formatCurrency(sold)}</strong>
          </span>
          <button className="btn" type="button" onClick={() => setConfirming(true)}>
            {t('retailCloseTill')} ({chosen.length})
          </button>
        </div>
      ) : null}
      {confirming ? (
        <ConfirmDialog
          title={t('retailCloseTillTitle')}
          message={`${chosen.length} ${t('retailSelectedDays')}. ${t('retailSoldShort')} ${formatCurrency(sold)}. ${t('retailProfitShort')} ${formatCurrency(profit)}. ${t('retailCloseTillBody')}`}
          confirmLabel={t('retailCloseTill')}
          cancelLabel={t('cancelAction')}
          busy={busy}
          onConfirm={() => void closeTill()}
          onCancel={() => setConfirming(false)}
        />
      ) : null}
      {toast ? <AppToast tone="success" message={toast} onDone={() => setToast(null)} /> : null}
    </div>
  );
}

function formatHeading(iso: string, locale: string): string {
  const [year, month, day] = iso.split('-').map(Number);
  return new Intl.DateTimeFormat(locale === 'en' ? 'en' : 'es-CO', { weekday: 'short', day: 'numeric', month: 'short' }).format(
    new Date(year, (month ?? 1) - 1, day)
  );
}
