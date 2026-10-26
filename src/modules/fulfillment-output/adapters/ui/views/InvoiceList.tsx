import { formatCurrency } from '@/modules/catalog/domain/value-objects/price';
import type { MessageKey } from '@/shared/i18n/messages';
import { useLocale } from '@/shared/i18n/useLocale';

const statusKey = {
  CONFIRMED: 'statusConfirmed',
  VOIDED: 'statusVoided'
} as const;

const invoices = [
  { id: 'i1', number: '001', customer: 'Minimercado El Vecino', total: 312000, status: 'CONFIRMED' as const },
  { id: 'i2', number: '003', customer: 'Tienda Doña Rosa', total: 148500, status: 'CONFIRMED' as const },
  { id: 'i3', number: '002', customer: 'Supertienda La 80', total: 90000, status: 'VOIDED' as const }
];

export function InvoiceList() {
  const { t } = useLocale();
  return (
    <section className="stack">
      <h1>{t('invoices')}</h1>
      <p className="m">{t('dummyNotice')}</p>
      <ul className="list">
        {invoices.map(invoice => (
          <li key={invoice.id} className="card">
            <div className="row">
              <b>
                {invoice.number} · {invoice.customer}
              </b>
              <span className={`tag tag-${invoice.status.toLowerCase()}`}>{t(statusKey[invoice.status] as MessageKey)}</span>
            </div>
            <span className="m">{formatCurrency(invoice.total)}</span>
            <span className="m">{invoice.status === 'VOIDED' ? t('notPrintable') : t('printable')}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
