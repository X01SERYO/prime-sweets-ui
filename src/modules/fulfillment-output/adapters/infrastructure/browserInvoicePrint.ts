import type { InvoicePrintPort } from '@/modules/fulfillment-output/application/ports/invoicePrint.port';
import type { InvoiceDocumentModel } from '@/modules/fulfillment-output/domain/models/invoiceSummary';
import { formatCurrency } from '@/shared/domain/money';

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, char => {
    if (char === '&') return '&amp;';
    if (char === '<') return '&lt;';
    if (char === '>') return '&gt;';
    if (char === '"') return '&quot;';
    return '&#39;';
  });
}

function sheet(document: InvoiceDocumentModel): string {
  const lines = document.lines
    .map(
      line =>
        `<tr><td>${escapeHtml(line.productId)}</td><td>${escapeHtml(line.productName)}</td><td>${line.quantity}</td><td>${formatCurrency(line.unitValue)}</td><td>${formatCurrency(line.totalValue)}</td></tr>`
    )
    .join('');
  const logo = document.logo ? `<img alt="" src="${escapeHtml(document.logo)}" />` : '';
  return `<article class="invoice-sheet">
    ${logo}
    <h1>${escapeHtml(document.companyName)}</h1>
    <p>${escapeHtml(document.companyNit)} · ${escapeHtml(document.city)} · ${escapeHtml(document.country)}</p>
    <p>${escapeHtml(document.telephone)}</p>
    <p>${escapeHtml(document.taxRegime)}</p>
    <p>${escapeHtml(document.customerDocumentType)} ${escapeHtml(document.customerDocumentNumber)} · ${escapeHtml(document.customerName)}</p>
    <p>${escapeHtml(document.invoiceNumber)} · ${escapeHtml(document.saleDate)}</p>
    <table><tbody>${lines}</tbody></table>
    <p>${formatCurrency(document.subtotal)} · ${formatCurrency(document.total)}</p>
    <p>${escapeHtml(document.legalText)}</p>
  </article>`;
}

export class BrowserInvoicePrint implements InvoicePrintPort {
  print(documents: InvoiceDocumentModel[]): void {
    const frame = document.createElement('iframe');
    frame.title = 'invoice-print';
    frame.style.position = 'fixed';
    frame.style.width = '0';
    frame.style.height = '0';
    frame.style.border = '0';
    document.body.appendChild(frame);
    const win = frame.contentWindow;
    const doc = win?.document;
    if (!win || !doc) {
      frame.remove();
      return;
    }
    doc.open();
    doc.write(`<!DOCTYPE html><html><head><meta charset="utf-8" /><style>
      @page { size: 80mm auto; margin: 4mm; }
      body { margin: 0; font: 12px sans-serif; }
      .invoice-sheet { break-after: page; page-break-after: always; }
      .invoice-sheet:last-child { break-after: auto; page-break-after: auto; }
      img { max-width: 40mm; height: auto; }
      table { width: 100%; border-collapse: collapse; }
      td { vertical-align: top; }
    </style></head><body>${documents.map(sheet).join('')}</body></html>`);
    doc.close();
    win.focus();
    win.print();
    win.addEventListener('afterprint', () => frame.remove());
  }
}
