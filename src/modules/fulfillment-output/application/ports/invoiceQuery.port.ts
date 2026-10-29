import type { InvoiceDocumentModel, InvoiceSummaryModel } from '@/modules/fulfillment-output/domain/models/invoiceSummary';

export interface InvoiceQueryPort {
  list(salesDayId: string): Promise<InvoiceSummaryModel[]>;
  get(saleId: string): Promise<InvoiceDocumentModel>;
}
