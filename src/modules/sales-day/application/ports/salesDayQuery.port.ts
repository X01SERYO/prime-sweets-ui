import type { SalesDayModel } from '@/modules/sales-day/domain/models/salesDay';

export interface SalesDayQueryPort {
  getCurrent(sellerId: string): Promise<SalesDayModel | null>;
  listRecent(sellerId: string): Promise<SalesDayModel[]>;
}
