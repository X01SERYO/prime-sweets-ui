import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { useInvoices } from '@/modules/fulfillment-output/adapters/ui/hooks/useInvoices';
import { usePrintInvoices } from '@/modules/fulfillment-output/adapters/ui/hooks/usePrintInvoices';
import type { ListInvoicesUseCase } from '@/modules/fulfillment-output/application/use-cases/listInvoices.useCase';
import type { PrintInvoicesUseCase } from '@/modules/fulfillment-output/application/use-cases/printInvoices.useCase';
import { formatCurrency } from '@/shared/domain/money';
import type { MessageKey } from '@/shared/i18n/messages';
import { useLocale } from '@/shared/i18n/useLocale';
import './invoiceList.css';

const statusKey = {
  CONFIRMED: 'statusConfirmed',
  VOIDED: 'statusVoided'
} as const;

interface InvoiceListProps {
  listInvoices: ListInvoicesUseCase;
  printInvoices: PrintInvoicesUseCase;
}

export function InvoiceList({ listInvoices, printInvoices }: InvoiceListProps) {
  const { t } = useLocale();
  const { salesDayId } = useParams();
  const listed = useInvoices(salesDayId, listInvoices);
  const printing = usePrintInvoices(printInvoices);
  const [selected, setSelected] = useState<string[]>([]);
  const printable = listed.invoices.filter(invoice => invoice.status === 'CONFIRMED');

  function toggle(saleId: string) {
    setSelected(current => (current.includes(saleId) ? current.filter(id => id !== saleId) : [...current, saleId]));
  }

  return (
    <section className="stack">
      <h1>{t('invoices')}</h1>
      {listed.loading ? <p>{t('invoiceListLoading')}</p> : null}
      {listed.error ? <p className="alert">{t(listed.error)}</p> : null}
      {printing.error ? <p className="alert">{t(printing.error)}</p> : null}
      {!listed.loading && !listed.error && listed.invoices.length === 0 ? <p>{t('invoiceListEmpty')}</p> : null}
      <ul className="list">
        {listed.invoices.map(invoice => (
          <li key={invoice.saleId} className="card">
            <div className="row">
              <label className="invoice-pick">
                <input
                  type="checkbox"
                  checked={selected.includes(invoice.saleId)}
                  disabled={invoice.status !== 'CONFIRMED' || printing.printing}
                  onChange={() => toggle(invoice.saleId)}
                />
                <b>{invoice.invoiceNumber}</b>
              </label>
              <span className={`tag tag-${invoice.status.toLowerCase()}`}>{t(statusKey[invoice.status] as MessageKey)}</span>
            </div>
            <span className="m">{formatCurrency(invoice.totalAmount)}</span>
            <span className="m">{invoice.status === 'VOIDED' ? t('notPrintable') : t('printable')}</span>
            {invoice.status === 'CONFIRMED' && salesDayId ? (
              <Link to={`/invoices/${salesDayId}/${invoice.saleId}`}>{t('invoicePreview')}</Link>
            ) : null}
          </li>
        ))}
      </ul>
      <div className="row">
        <button className="btn" type="button" disabled={printing.printing || selected.length === 0} onClick={() => void printing.print(selected)}>
          {printing.printing ? t('invoicePrinting') : t('printSelected')}
        </button>
        <button
          className="btn btn-secondary"
          type="button"
          disabled={printing.printing || printable.length === 0}
          onClick={() => void printing.print(printable.map(invoice => invoice.saleId))}
        >
          {t('printAll')}
        </button>
      </div>
    </section>
  );
}
