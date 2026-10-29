import { Link } from 'react-router';
import { useDaySales } from '@/modules/sales/adapters/ui/hooks/useDaySales';
import type { ListDaySalesUseCase } from '@/modules/sales/application/use-cases/listDaySales.useCase';
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
}

export function DaySalesList({ sellerId, getCurrentSalesDay, listDaySales }: DaySalesListProps) {
  const { t } = useLocale();
  const listed = useDaySales(sellerId, getCurrentSalesDay, listDaySales);
  return (
    <section className="stack">
      <h1>{t('daySales')}</h1>
      {listed.loading ? <p>{t('daySalesLoading')}</p> : null}
      {listed.error ? <p className="alert">{t(listed.error)}</p> : null}
      {!listed.loading && !listed.error && listed.sales.length === 0 ? <p>{t('daySalesEmpty')}</p> : null}
      <ul className="list">
        {listed.sales.map(sale => (
          <li key={sale.id} className="card">
            <div className="row">
              <b>{sale.customerName}</b>
              <span className={`tag tag-${sale.status.toLowerCase()}`}>{t(statusKey[sale.status])}</span>
            </div>
            <span className="m">
              {sale.invoiceNumber ? `${t('invoice')} ${sale.invoiceNumber} · ` : ''}
              {sale.quantity} {t('units')} · {formatCurrency(sale.total)}
            </span>
            {sale.status === 'DRAFT' ? (
              <Link className="btn btn-secondary" to={`/sales?customerId=${encodeURIComponent(sale.customerId)}`}>
                {t('sale')}
              </Link>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
