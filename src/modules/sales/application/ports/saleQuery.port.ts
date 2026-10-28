import type { SaleModel } from '@/modules/sales/domain/models/sale';

export interface SaleQueryPort {
  listDrafts(salesDayId: string, customerId: string): Promise<SaleModel[]>;
}
