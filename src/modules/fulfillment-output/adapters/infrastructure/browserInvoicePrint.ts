import type { InvoicePrintPort } from '@/modules/fulfillment-output/application/ports/invoicePrint.port';
import type { InvoiceDocumentModel } from '@/modules/fulfillment-output/domain/models/invoiceSummary';
import { formatCurrency } from '@/shared/domain/money';

const SHEET_CSS = `
  @page { size: 70mm auto; margin: 0; }
  html, body { margin: 0; padding: 0; background: #fff; color: #000; }
  body { font: 400 13px "Courier New", Courier, monospace; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .invoice-sheet {
    width: 70mm;
    max-width: 70mm;
    margin: 0;
    color: #000;
    background: #fff;
    text-align: left;
    break-after: page;
    page-break-after: always;
  }
  .invoice-sheet:last-child { break-after: auto; page-break-after: auto; }
  .invoice-sheet * { color: #000; font-weight: 400; }
  .center { text-align: center; }
  .logo { display: block; width: 64mm; max-width: 64mm; height: auto; margin: 0 auto 6mm; }
  .name { margin: 0; font-size: 13px; text-transform: uppercase; }
  .small { font-size: 11px; }
  .invoice-sheet .b { font-weight: 700; }
  .invoice-sheet th, .invoice-sheet td, .invoice-sheet th *, .invoice-sheet td * { font-weight: 700; }
  .invoice-sheet .total, .invoice-sheet .total * { font-weight: 700; }
  .line { margin: 1mm 0; }
  .rule { border: 0; border-top: 1px solid #000; margin: 2mm 0; }
  .before-total { margin: 6mm 0 0; }
  table { width: 70mm; border-collapse: collapse; table-layout: fixed; margin-top: 5mm; }
  th, td { font-size: 11px; text-align: left; vertical-align: top; padding: 0.6mm 0.3mm; overflow-wrap: anywhere; }
  th { border-top: 1px solid #000; border-bottom: 1px solid #000; text-align: left; white-space: nowrap; overflow-wrap: normal; font-size: 10px; padding: 0.6mm 0.2mm; }
  td.product { text-align: left; }
  .num { text-align: right; white-space: nowrap; font-size: 11px; }
  td:nth-child(3) { text-align: left; }
  th:first-child, td:first-child { padding-right: 0.4mm; }
  .col-product { width: 32mm; }
  .col-qty { width: 8mm; }
  .col-money { width: 15mm; }
  .qty { display: inline-block; width: 4ch; text-align: right; }
  th .qty { text-align: left; }
  .total { display: flex; justify-content: flex-end; gap: 4mm; margin: 4mm 0 0; font-size: 13px; }
  .invoice-sheet .legal { margin: 16mm 0 0; font-size: 8px; font-weight: 400; line-height: 1.3; }
`;

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, char => {
    if (char === '&') return '&amp;';
    if (char === '<') return '&lt;';
    if (char === '>') return '&gt;';
    if (char === '"') return '&quot;';
    return '&#39;';
  });
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

function sheet(document: InvoiceDocumentModel): string {
  const lines = document.lines
    .map(
      line =>
        `<tr><td><span class="qty">${line.quantity}</span></td><td class="product">${escapeHtml(line.productName)}</td><td class="num">${formatCurrency(line.unitValue)}</td><td class="num">${formatCurrency(line.totalValue)}</td></tr>`
    )
    .join('');
  const logo = document.logo ? `<img class="logo" alt="" src="${escapeHtml(document.logo)}" />` : '';
  return `<article class="invoice-sheet">
    ${logo}
    <p class="name center b">${escapeHtml(document.companyName)}</p>
    <p class="line center b">NIT ${escapeHtml(document.companyNit)}</p>
    <p class="line small center">${escapeHtml(document.city)}, ${escapeHtml(document.country)}</p>
    <p class="line small center"><span class="b">Teléfono:</span> ${escapeHtml(document.telephone)}</p>
    <p class="line small center"><span class="b">Régimen:</span> ${escapeHtml(document.taxRegime)}</p>
    <hr class="rule" />
    <p class="line center">${escapeHtml(document.customerDocumentType)} ${escapeHtml(document.customerDocumentNumber)}</p>
    <p class="line center b">${escapeHtml(document.customerName)}</p>
    <hr class="rule" />
    <p class="line small center b">Factura</p>
    <p class="line small center b">No ${escapeHtml(document.invoiceNumber)}</p>
    <p class="line small center"><span class="b">Fecha:</span> ${escapeHtml(saleDay(document.saleDate))}</p>
    <p class="line small center"><span class="b">Método de pago:</span> Efectivo</p>
    <p class="line small center"><span class="b">Vencimiento:</span> ${escapeHtml(saleDay(document.saleDate))}</p>
    <table>
      <colgroup><col class="col-qty" /><col class="col-product" /><col class="col-money" /><col class="col-money" /></colgroup>
      <thead><tr><th><span class="qty">CANT</span></th><th>PRODUCTO</th><th>V/UND</th><th>V/TOTAL</th></tr></thead>
      <tbody>${lines}</tbody>
    </table>
    <hr class="rule before-total" />
    <p class="total b"><span>Total</span><span>${formatCurrency(document.total)}</span></p>
    <p class="legal">${escapeHtml(document.legalText)}</p>
  </article>`;
}

function whenReady(image: HTMLImageElement): Promise<void> {
  if (image.complete) {
    return Promise.resolve();
  }
  return new Promise(resolve => {
    image.onload = () => resolve();
    image.onerror = () => resolve();
  });
}

export class BrowserInvoicePrint implements InvoicePrintPort {
  print(documents: InvoiceDocumentModel[]): void {
    void this.render(documents);
  }

  private async render(documents: InvoiceDocumentModel[]): Promise<void> {
    const frame = document.createElement('iframe');
    frame.title = 'invoice-print';
    frame.style.position = 'fixed';
    frame.style.left = '-10000px';
    frame.style.width = '70mm';
    frame.style.height = '200mm';
    frame.style.border = '0';
    document.body.appendChild(frame);
    const win = frame.contentWindow;
    const doc = win?.document;
    if (!win || !doc) {
      frame.remove();
      return;
    }
    doc.open();
    doc.write(`<!DOCTYPE html><html><head><meta charset="utf-8" /><style>${SHEET_CSS}</style></head><body>${documents.map(sheet).join('')}</body></html>`);
    doc.close();
    await Promise.all([...doc.images].map(image => whenReady(image)));
    win.focus();
    win.print();
    win.addEventListener('afterprint', () => frame.remove());
  }
}
