import type { SaleModel } from '@/modules/sales/domain/models/sale';

export interface SaleQueryPort {
  listDrafts(deliveryDate: string, customerId: string): Promise<SaleModel[]>;
  listByDeliveryDate(deliveryDate: string): Promise<SaleModel[]>;
  get(saleId: string): Promise<SaleModel>;
}
