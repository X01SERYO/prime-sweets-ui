export type DaySaleStatus = 'DRAFT' | 'CONFIRMED' | 'VOIDED';

export interface DaySaleModel {
  id: string;
  customer: string;
  status: DaySaleStatus;
  quantity: number;
  total: number;
  invoiceNumber: string | null;
}
