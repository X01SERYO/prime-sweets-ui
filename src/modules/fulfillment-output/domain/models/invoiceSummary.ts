export type InvoiceStatus = 'CONFIRMED' | 'VOIDED';

export interface InvoiceSummaryModel {
  id: string;
  number: string;
  customer: string;
  total: number;
  status: InvoiceStatus;
}
