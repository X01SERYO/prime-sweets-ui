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
      <table className="invoice-table">
        <tbody>
        {listed.invoices.map(invoice => (
          <tr key={invoice.saleId}>
            <td>
              <label className="invoice-pick">
                <input
                  type="checkbox"
                  aria-label={invoice.invoiceNumber}
                  checked={selected.includes(invoice.saleId)}
                  disabled={invoice.status !== 'CONFIRMED' || printing.printing}
                  onChange={() => toggle(invoice.saleId)}
                />
              </label>
            </td>
            <td>
              <b className="invoice-number">{invoice.invoiceNumber}</b>
            </td>
            <td>
              <span className={`tag tag-${invoice.status.toLowerCase()}`}>{t(statusKey[invoice.status] as MessageKey)}</span>
            </td>
            <td className="invoice-amount">{formatCurrency(invoice.totalAmount)}</td>
            <td>{invoice.status === 'VOIDED' ? t('notPrintable') : t('printable')}</td>
            <td className="invoice-preview">
              {invoice.status === 'CONFIRMED' && salesDayId ? (
                <Link className="btn icon-btn icon-edit" to={`/invoices/${salesDayId}/${invoice.saleId}`} aria-label={t('invoicePreview')}>
                  <EyeIcon />
                </Link>
              ) : null}
            </td>
          </tr>
        ))}
        </tbody>
      </table>
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

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z"
      />
      <circle cx="12" cy="12" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}
