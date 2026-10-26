import { Link } from 'react-router';
import { useDaySales } from '@/modules/sales/adapters/ui/hooks/useDaySales';
import { listDaySales } from '@/modules/sales/sales.composition';
import { formatCurrency } from '@/shared/domain/money';
import { useLocale } from '@/shared/i18n/useLocale';

const statusKey = {
  DRAFT: 'statusDraft',
  CONFIRMED: 'statusConfirmed',
  VOIDED: 'statusVoided'
} as const;

export function DaySalesList() {
  const { t } = useLocale();
  const sales = useDaySales(listDaySales);
  return (
    <section className="stack">
      <h1>{t('daySales')}</h1>
      <p className="m">{t('dummyNotice')}</p>
      <ul className="list">
        {sales.map(sale => (
          <li key={sale.id} className="card">
            <div className="row">
              <b>{sale.customer}</b>
              <span className={`tag tag-${sale.status.toLowerCase()}`}>{t(statusKey[sale.status])}</span>
            </div>
            <span className="m">
              {sale.invoiceNumber ? `${t('invoice')} ${sale.invoiceNumber} · ` : ''}
              {sale.quantity} {t('units')} · {formatCurrency(sale.total)}
            </span>
            {sale.status === 'DRAFT' ? (
              <Link className="btn btn-secondary" to="/sales">
                {t('sale')}
              </Link>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
