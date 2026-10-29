import { useState } from 'react';
import { Link } from 'react-router';
import { useDaySales } from '@/modules/sales/adapters/ui/hooks/useDaySales';
import { useVoidListedSale } from '@/modules/sales/adapters/ui/hooks/useVoidListedSale';
import type { ListDaySalesUseCase } from '@/modules/sales/application/use-cases/listDaySales.useCase';
import type { VoidSaleUseCase } from '@/modules/sales/application/use-cases/voidSale.useCase';
import type { GetCurrentSalesDayUseCase } from '@/modules/sales-day/application/use-cases/getCurrentSalesDay.useCase';
import { formatCurrency } from '@/shared/domain/money';
import { useLocale } from '@/shared/i18n/useLocale';

const statusKey = {
  DRAFT: 'statusDraft',
  CONFIRMED: 'statusConfirmed',
  VOIDED: 'statusVoided'
} as const;

interface DaySalesListProps {
  sellerId: string;
  getCurrentSalesDay: GetCurrentSalesDayUseCase;
  listDaySales: ListDaySalesUseCase;
  voidSale: VoidSaleUseCase;
}

export function DaySalesList({ sellerId, getCurrentSalesDay, listDaySales, voidSale }: DaySalesListProps) {
  const { t } = useLocale();
  const listed = useDaySales(sellerId, getCurrentSalesDay, listDaySales);
  const voiding = useVoidListedSale(voidSale, listed.reload);
  const [pendingVoidId, setPendingVoidId] = useState<string | null>(null);
  return (
    <section className="stack">
      <h1>{t('daySales')}</h1>
      {listed.loading ? <p>{t('daySalesLoading')}</p> : null}
      {listed.error ? <p className="alert">{t(listed.error)}</p> : null}
      {voiding.error ? <p role="alert">{t(voiding.error)}</p> : null}
      {!listed.loading && !listed.error && listed.sales.length === 0 ? <p>{t('daySalesEmpty')}</p> : null}
      <ul className="list">
        {listed.sales.map(sale => (
          <li key={sale.id} className="card sale-row">
            <b>{sale.customerName}</b>
            <span className={`tag tag-${sale.status.toLowerCase()}`}>{t(statusKey[sale.status])}</span>
            <span className="m sale-meta">
              {sale.invoiceNumber ? `${sale.invoiceNumber} · ` : ''}
              {formatCurrency(sale.total)}
            </span>
            <span className="sale-col">
              {listed.dayOpen && (sale.status === 'DRAFT' || sale.status === 'CONFIRMED') ? (
                <Link className="btn icon-btn icon-edit" to={`/sales?saleId=${encodeURIComponent(sale.id)}`} aria-label={t('editSale')}>
                  <EditIcon />
                </Link>
              ) : null}
            </span>
            <span className="sale-col">
              {listed.dayOpen && sale.status === 'CONFIRMED' ? (
                <button
                  className="btn icon-btn icon-void"
                  type="button"
                  aria-label={t('voidSale')}
                  disabled={voiding.voidingId !== null || pendingVoidId === sale.id}
                  onClick={() => setPendingVoidId(sale.id)}
                >
                  <VoidIcon />
                </button>
              ) : null}
            </span>
            {pendingVoidId === sale.id ? (
              <form
                className="sale-confirm"
                onSubmit={event => {
                  event.preventDefault();
                  void voiding.voidConfirmed(sale.id).then(saved => {
                    if (saved) {
                      setPendingVoidId(null);
                    }
                  });
                }}
              >
                <p>{t('confirmVoid')}</p>
                <div className="row">
                  <button className="btn icon-void" type="submit" disabled={voiding.voidingId === sale.id}>
                    {voiding.voidingId === sale.id ? t('voidingSale') : t('confirmAction')}
                  </button>
                  <button className="btn btn-secondary" type="button" onClick={() => setPendingVoidId(null)}>
                    {t('cancelAction')}
                  </button>
                </div>
              </form>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

function EditIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zm17.71-10.04a1 1 0 0 0 0-1.41l-2.5-2.5a1 1 0 0 0-1.41 0l-1.96 1.96 3.75 3.75 2.12-1.8z"
      />
    </svg>
  );
}

function VoidIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 2c1.85 0 3.55.63 4.9 1.69L5.69 16.9A8 8 0 0 1 12 4zm0 16a8 8 0 0 1-4.9-1.69L18.31 7.1A8 8 0 0 1 12 20z"
      />
    </svg>
  );
}
