import type { InvoiceQueryPort } from '@/modules/fulfillment-output/application/ports/invoiceQuery.port';
import type { InvoiceSummaryModel } from '@/modules/fulfillment-output/domain/models/invoiceSummary';

const invoices: InvoiceSummaryModel[] = [
  { id: 'i1', number: '001', customer: 'Minimercado El Vecino', total: 312000, status: 'CONFIRMED' },
  { id: 'i2', number: '003', customer: 'Tienda Doña Rosa', total: 148500, status: 'CONFIRMED' },
  { id: 'i3', number: '002', customer: 'Supertienda La 80', total: 90000, status: 'VOIDED' }
];

export class SampleInvoiceQuery implements InvoiceQueryPort {
  list(): InvoiceSummaryModel[] {
    return invoices;
  }
}
