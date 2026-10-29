import type { InvoiceQueryPort } from '@/modules/fulfillment-output/application/ports/invoiceQuery.port';
import { InvoiceInvalidError } from '@/modules/fulfillment-output/domain/errors/invoiceInvalid.error';
import type { InvoiceDocumentModel } from '@/modules/fulfillment-output/domain/models/invoiceSummary';

export class GenerateInvoiceUseCase {
  private readonly query: InvoiceQueryPort;

  constructor(query: InvoiceQueryPort) {
    this.query = query;
  }

  async execute(saleId: string): Promise<InvoiceDocumentModel> {
    const id = saleId.trim();
    if (!id) {
      throw new InvoiceInvalidError();
    }
    const document = await this.query.get(id);
    if (!document.invoiceNumber) {
      throw new InvoiceInvalidError();
    }
    return document;
  }
}
