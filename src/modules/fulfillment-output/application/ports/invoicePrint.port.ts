import type { InvoiceDocumentModel } from '@/modules/fulfillment-output/domain/models/invoiceSummary';

export interface InvoicePrintPort {
  print(documents: InvoiceDocumentModel[]): void;
}
