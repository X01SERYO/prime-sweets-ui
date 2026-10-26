import type { InvoiceSummaryModel } from '@/modules/fulfillment-output/domain/models/invoiceSummary';

export interface InvoiceQueryPort {
  list(): InvoiceSummaryModel[];
}
