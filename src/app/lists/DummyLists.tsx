import { Link } from 'react-router';
import { formatCurrency } from '@/modules/catalog/domain/value-objects/price';
import { dummyCustomers, dummyDaySales, dummyInvoices, dummyLoadSheet } from '@/shared/dev/dummyLists';
import { useLocale } from '@/shared/i18n/useLocale';
import type { MessageKey } from '@/shared/i18n/messages';

const statusKey = {
  DRAFT: 'statusDraft',
  CONFIRMED: 'statusConfirmed',
  VOIDED: 'statusVoided'
} as const;

export function CustomerList() {
  const { t } = useLocale();
  return (
    <section className="stack">
      <h1>{t('customers')}</h1>
      <p className="m">{t('dummyNotice')}</p>
      <ul className="list">
        {dummyCustomers.map(customer => (
          <li key={customer.id} className="card">
            <b>{customer.name}</b>
            <span className="m">{customer.document}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function DaySalesList() {
  const { t } = useLocale();
  return (
    <section className="stack">
      <h1>{t('daySales')}</h1>
      <p className="m">{t('dummyNotice')}</p>
      <ul className="list">
        {dummyDaySales.map(sale => (
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

export function LoadSheetList() {
  const { t } = useLocale();
  return (
    <section className="stack">
      <h1>{t('loadSheet')}</h1>
      <p className="m">{t('dummyNotice')}</p>
      <ul className="list">
        {dummyLoadSheet.map(line => (
          <li key={line.id} className="card">
            <b>{line.name}</b>
            <span className="m">
              {line.brand} · {t('wholesaleCost')} {line.cost === null ? '—' : formatCurrency(line.cost)} · {t('wholesalePrice')}{' '}
              {formatCurrency(line.price)}
            </span>
            <span>
              {t('quantity')} {line.quantity} · {formatCurrency(line.total)} · {t('profit')}{' '}
              {line.profit === null ? '—' : formatCurrency(line.profit)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function InvoiceList() {
  const { t } = useLocale();
  return (
    <section className="stack">
      <h1>{t('invoices')}</h1>
      <p className="m">{t('dummyNotice')}</p>
      <ul className="list">
        {dummyInvoices.map(invoice => (
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
