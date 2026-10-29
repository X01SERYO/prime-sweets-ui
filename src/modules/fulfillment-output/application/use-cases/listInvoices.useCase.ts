import type { InvoiceQueryPort } from '@/modules/fulfillment-output/application/ports/invoiceQuery.port';
import { InvoiceInvalidError } from '@/modules/fulfillment-output/domain/errors/invoiceInvalid.error';
import type { InvoiceSummaryModel } from '@/modules/fulfillment-output/domain/models/invoiceSummary';

export class ListInvoicesUseCase {
  private readonly query: InvoiceQueryPort;

  constructor(query: InvoiceQueryPort) {
    this.query = query;
  }

  async execute(salesDayId: string): Promise<InvoiceSummaryModel[]> {
    const id = salesDayId.trim();
    if (!id) {
      throw new InvoiceInvalidError();
    }
    return this.query.list(id);
  }
}
