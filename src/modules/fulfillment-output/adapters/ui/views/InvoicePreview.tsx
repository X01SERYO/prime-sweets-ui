import { X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useInvoiceDocument } from '@/modules/fulfillment-output/adapters/ui/hooks/useInvoiceDocument';
import { usePrintInvoices } from '@/modules/fulfillment-output/adapters/ui/hooks/usePrintInvoices';
import type { GenerateInvoiceUseCase } from '@/modules/fulfillment-output/application/use-cases/generateInvoice.useCase';
import type { PrintInvoicesUseCase } from '@/modules/fulfillment-output/application/use-cases/printInvoices.useCase';
import { formatCurrency } from '@/shared/domain/money';
import { useLocale } from '@/shared/i18n/useLocale';
import { StatusMessage } from '@/shared/ui/StatusMessage';

function businessDay(value: string): string {
  const [year, month, day] = value.slice(0, 10).split('-');
  if (!year || !month || !day) {
    return value;
  }
  return `${day}/${month}/${year}`;
}

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
  saleId: string;
  generateInvoice: GenerateInvoiceUseCase;
  printInvoices: PrintInvoicesUseCase;
  onClose: () => void;
}

export function InvoicePreview({ saleId, generateInvoice, printInvoices, onClose }: InvoicePreviewProps) {
  const { t } = useLocale();
  const loaded = useInvoiceDocument(saleId, generateInvoice);
  const printing = usePrintInvoices(printInvoices);
  const document = loaded.document;
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || dialog.open) {
      return;
    }
    dialog.showModal();
    return () => {
      if (dialog.open) {
        dialog.close();
      }
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className="modal invoice-preview-modal"
      aria-labelledby="invoice-preview-title"
      onCancel={event => {
        event.preventDefault();
        if (!printing.printing) {
          onClose();
        }
      }}
      onClick={event => {
        if (event.target === event.currentTarget && !printing.printing) {
          onClose();
        }
      }}
    >
      <div className="modal-toolbar">
        <h2 id="invoice-preview-title">{t('invoicePreview')}</h2>
        <button className="modal-x" type="button" aria-label={t('close')} disabled={printing.printing} onClick={onClose}>
          <X aria-hidden="true" strokeWidth={2.2} />
        </button>
      </div>
      <p className="invoice-preview-note">{document?.voided ? t('invoicePreviewVoidNote') : t('invoicePreviewNote')}</p>
      <div className="modal-scroll">
        {loaded.loading ? <StatusMessage tone="info">{t('invoiceLoadLoading')}</StatusMessage> : null}
        {loaded.error ? (
          <StatusMessage tone={loaded.errorKind === 'business' ? 'warning' : 'error'}>
            <p>{t(loaded.error)}</p>
            <div className="row">
              <button className="btn" type="button" onClick={loaded.retry}>
                {t('retryInvoice')}
              </button>
            </div>
          </StatusMessage>
        ) : null}
        {printing.error ? <StatusMessage tone="error">{t(printing.error)}</StatusMessage> : null}
        {document ? (
          <article className="invoice-sheet">
            {document.voided ? <p className="invoice-void-mark">ANULADA</p> : null}
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
              <b>Fecha de entrega:</b> {businessDay(document.deliveryDate)}
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
        ) : null}
      </div>
      <div className="modal-actions modal-actions-end">
        <button className="btn btn-secondary" type="button" disabled={printing.printing} onClick={onClose}>
          {t('close')}
        </button>
        <button
          className="btn"
          type="button"
          disabled={printing.printing || !document || document.voided}
          onClick={() => void printing.print([saleId])}
        >
          {printing.printing ? t('invoicePrinting') : t('reprint')}
        </button>
      </div>
    </dialog>
  );
}
