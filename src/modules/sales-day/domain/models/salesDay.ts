export type SalesDayStatus = 'OPEN' | 'CLOSED';

export interface SalesDayModel {
  id: string;
  sellerId: string;
  date: string;
  status: SalesDayStatus;
}
