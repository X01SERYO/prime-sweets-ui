import type { InvoiceQueryPort } from '@/modules/fulfillment-output/application/ports/invoiceQuery.port';
import type { InvoiceSummaryModel } from '@/modules/fulfillment-output/domain/models/invoiceSummary';

export class ListInvoicesUseCase {
  private readonly query: InvoiceQueryPort;

  constructor(query: InvoiceQueryPort) {
    this.query = query;
  }

  execute(): InvoiceSummaryModel[] {
    return this.query.list();
  }
}
