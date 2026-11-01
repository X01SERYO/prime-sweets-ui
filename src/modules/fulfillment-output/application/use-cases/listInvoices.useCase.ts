import type { InvoiceQueryPort } from '@/modules/fulfillment-output/application/ports/invoiceQuery.port';
import { InvoiceInvalidError } from '@/modules/fulfillment-output/domain/errors/invoiceInvalid.error';
import type { InvoiceSummaryModel } from '@/modules/fulfillment-output/domain/models/invoiceSummary';

export class ListInvoicesUseCase {
  private readonly query: InvoiceQueryPort;

  constructor(query: InvoiceQueryPort) {
    this.query = query;
  }

  async execute(deliveryDate: string): Promise<InvoiceSummaryModel[]> {
    const id = deliveryDate.trim();
    if (!id) {
      throw new InvoiceInvalidError();
    }
    return this.query.list(id);
  }
}
