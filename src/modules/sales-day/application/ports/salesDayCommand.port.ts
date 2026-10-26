import type { SalesDayModel } from '@/modules/sales-day/domain/models/salesDay';

export interface SalesDayCommandPort {
  open(sellerId: string): Promise<SalesDayModel>;
}
