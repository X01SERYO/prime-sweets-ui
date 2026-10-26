import { useInvoices } from '@/modules/fulfillment-output/adapters/ui/hooks/useInvoices';
import { listInvoices } from '@/modules/fulfillment-output/fulfillmentOutput.composition';
import { formatCurrency } from '@/shared/domain/money';
import type { MessageKey } from '@/shared/i18n/messages';
import { useLocale } from '@/shared/i18n/useLocale';

const statusKey = {
  CONFIRMED: 'statusConfirmed',
  VOIDED: 'statusVoided'
} as const;

export function InvoiceList() {
  const { t } = useLocale();
  const invoices = useInvoices(listInvoices);
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
