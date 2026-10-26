import { Link } from 'react-router';
import { formatCurrency } from '@/modules/catalog/domain/value-objects/price';
import { useLocale } from '@/shared/i18n/useLocale';

const statusKey = {
  DRAFT: 'statusDraft',
  CONFIRMED: 'statusConfirmed',
  VOIDED: 'statusVoided'
} as const;

const sales = [
  { id: 's1', customer: 'Tienda Doña Rosa', status: 'DRAFT' as const, quantity: 10, total: 148500, invoiceNumber: null },
  { id: 's2', customer: 'Minimercado El Vecino', status: 'CONFIRMED' as const, quantity: 24, total: 312000, invoiceNumber: '001' },
  { id: 's3', customer: 'Supertienda La 80', status: 'VOIDED' as const, quantity: 6, total: 90000, invoiceNumber: '002' }
];

export function DaySalesList() {
  const { t } = useLocale();
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
