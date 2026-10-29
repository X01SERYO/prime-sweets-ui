import type { GenerateInvoiceUseCase } from '@/modules/fulfillment-output/application/use-cases/generateInvoice.useCase';
import type { InvoicePrintPort } from '@/modules/fulfillment-output/application/ports/invoicePrint.port';
import { InvoiceInvalidError } from '@/modules/fulfillment-output/domain/errors/invoiceInvalid.error';

export class PrintInvoicesUseCase {
  private readonly generate: GenerateInvoiceUseCase;
  private readonly printer: InvoicePrintPort;

  constructor(generate: GenerateInvoiceUseCase, printer: InvoicePrintPort) {
    this.generate = generate;
    this.printer = printer;
  }

  async execute(saleIds: string[]): Promise<void> {
    const ids = saleIds.map(id => id.trim()).filter(Boolean);
    if (ids.length === 0) {
      throw new InvoiceInvalidError();
    }
    const documents = [];
    for (const id of ids) {
      documents.push(await this.generate.execute(id));
    }
    documents.sort((left, right) => Number(left.invoiceNumber) - Number(right.invoiceNumber));
    this.printer.print(documents);
  }
}
