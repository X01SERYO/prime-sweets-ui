import { Link, useParams } from 'react-router';
import { useInvoiceDocument } from '@/modules/fulfillment-output/adapters/ui/hooks/useInvoiceDocument';
import { usePrintInvoices } from '@/modules/fulfillment-output/adapters/ui/hooks/usePrintInvoices';
import type { GenerateInvoiceUseCase } from '@/modules/fulfillment-output/application/use-cases/generateInvoice.useCase';
import type { PrintInvoicesUseCase } from '@/modules/fulfillment-output/application/use-cases/printInvoices.useCase';
import { formatCurrency } from '@/shared/domain/money';
import { useLocale } from '@/shared/i18n/useLocale';

interface InvoicePreviewProps {
  generateInvoice: GenerateInvoiceUseCase;
  printInvoices: PrintInvoicesUseCase;
}

export function InvoicePreview({ generateInvoice, printInvoices }: InvoicePreviewProps) {
  const { t } = useLocale();
  const { salesDayId, saleId } = useParams();
  const loaded = useInvoiceDocument(saleId, generateInvoice);
  const printing = usePrintInvoices(printInvoices);
  const document = loaded.document;

  return (
    <section className="stack">
      <h1>{t('invoicePreview')}</h1>
      {salesDayId ? <Link to={`/invoices/${salesDayId}`}>{t('invoices')}</Link> : null}
      {loaded.loading ? <p>{t('invoiceLoadLoading')}</p> : null}
      {loaded.error ? <p className="alert">{t(loaded.error)}</p> : null}
      {printing.error ? <p className="alert">{t(printing.error)}</p> : null}
      {document ? (
        <article className="card stack">
          {document.logo ? <img alt="" src={document.logo} /> : null}
          <b>{document.companyName}</b>
          <span>
            {document.companyNit} · {document.city} · {document.country}
          </span>
          <span>{document.telephone}</span>
          <span>{document.taxRegime}</span>
          <span>
            {document.customerDocumentType} {document.customerDocumentNumber} · {document.customerName}
          </span>
          <span>
            {document.invoiceNumber} · {document.saleDate}
          </span>
          <ul className="list">
            {document.lines.map(line => (
              <li key={`${line.productId}:${line.productName}`}>
                {line.productId} · {line.productName} · {line.quantity} · {formatCurrency(line.unitValue)} · {formatCurrency(line.totalValue)}
              </li>
            ))}
          </ul>
          <span>
            {formatCurrency(document.subtotal)} · {formatCurrency(document.total)}
          </span>
          <p>{document.legalText}</p>
          <button className="btn" type="button" disabled={printing.printing} onClick={() => void printing.print([saleId ?? ''])}>
            {printing.printing ? t('invoicePrinting') : t('reprint')}
          </button>
        </article>
      ) : null}
    </section>
  );
}
