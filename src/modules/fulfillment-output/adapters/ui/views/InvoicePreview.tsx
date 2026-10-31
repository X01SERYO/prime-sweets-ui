import { useParams } from 'react-router';
import { useInvoiceDocument } from '@/modules/fulfillment-output/adapters/ui/hooks/useInvoiceDocument';
import { usePrintInvoices } from '@/modules/fulfillment-output/adapters/ui/hooks/usePrintInvoices';
import type { GenerateInvoiceUseCase } from '@/modules/fulfillment-output/application/use-cases/generateInvoice.useCase';
import type { PrintInvoicesUseCase } from '@/modules/fulfillment-output/application/use-cases/printInvoices.useCase';
import { formatCurrency } from '@/shared/domain/money';
import { useLocale } from '@/shared/i18n/useLocale';
import { ScreenTitle } from '@/shared/ui/BackButton';

function saleDay(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat('es-CO', {
    timeZone: 'America/Bogota',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date);
}

interface InvoicePreviewProps {
  generateInvoice: GenerateInvoiceUseCase;
  printInvoices: PrintInvoicesUseCase;
}

export function InvoicePreview({ generateInvoice, printInvoices }: InvoicePreviewProps) {
  const { t } = useLocale();
  const { saleId } = useParams();
  const loaded = useInvoiceDocument(saleId, generateInvoice);
  const printing = usePrintInvoices(printInvoices);
  const document = loaded.document;

  return (
    <section className="stack">
      <ScreenTitle>{t('invoicePreview')}</ScreenTitle>
      {loaded.loading ? <p>{t('invoiceLoadLoading')}</p> : null}
      {loaded.error ? (
        <div className={loaded.errorKind === 'business' ? 'notice notice-business' : 'notice notice-error'} role="alert">
          <p>{t(loaded.error)}</p>
          <div className="row">
            <button className="btn" type="button" onClick={loaded.retry}>
              {t('retryInvoice')}
            </button>
          </div>
        </div>
      ) : null}
      {printing.error ? <p className="alert">{t(printing.error)}</p> : null}
      {document ? (
        <>
          <article className="invoice-sheet">
            {document.logo ? <img className="invoice-logo" alt="" src={document.logo} /> : null}
            <p className="invoice-name">{document.companyName}</p>
            <p className="b">NIT {document.companyNit}</p>
            <p className="small">
              {document.city}, {document.country}
            </p>
            <p className="small">
              <b>Teléfono:</b> {document.telephone}
            </p>
            <p className="small">
              <b>Régimen:</b> {document.taxRegime}
            </p>
            <hr />
            <p>
              {document.customerDocumentType} {document.customerDocumentNumber}
            </p>
            <p className="b">{document.customerName}</p>
            <hr />
            <p className="b small">Factura</p>
            <p className="b small">No {document.invoiceNumber}</p>
            <p className="small">
              <b>Fecha:</b> {saleDay(document.saleDate)}
            </p>
            <p className="small">
              <b>Método de pago:</b> Efectivo
            </p>
            <p className="small">
              <b>Vencimiento:</b> {saleDay(document.saleDate)}
            </p>
            <table>
              <colgroup>
                <col className="col-qty" />
                <col className="col-product" />
                <col className="col-money" />
                <col className="col-money" />
              </colgroup>
              <thead>
                <tr>
                  <th>
                    <span className="qty">CANT</span>
                  </th>
                  <th>PRODUCTO</th>
                  <th>V/UND</th>
                  <th>V/TOTAL</th>
                </tr>
              </thead>
              <tbody>
                {document.lines.map(line => (
                  <tr key={`${line.productId}:${line.productName}`}>
                    <td>
                      <span className="qty">{line.quantity}</span>
                    </td>
                    <td className="product">{line.productName}</td>
                    <td className="num">{formatCurrency(line.unitValue)}</td>
                    <td className="num">{formatCurrency(line.totalValue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <hr className="invoice-before-total" />
            <p className="invoice-total">
              <span>Total</span>
              <span>{formatCurrency(document.total)}</span>
            </p>
          </article>
          <button className="btn" type="button" disabled={printing.printing} onClick={() => void printing.print([saleId ?? ''])}>
            {printing.printing ? t('invoicePrinting') : t('reprint')}
          </button>
        </>
      ) : null}
    </section>
  );
}
