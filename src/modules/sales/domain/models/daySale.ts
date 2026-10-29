export type DaySaleStatus = 'DRAFT' | 'CONFIRMED' | 'VOIDED';

export interface DaySaleModel {
  id: string;
  customerId: string;
  customerName: string;
  status: DaySaleStatus;
  quantity: number;
  total: number;
  invoiceNumber: string | null;
}
