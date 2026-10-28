import type { SaleModel } from '@/modules/sales/domain/models/sale';

export interface SaleCommandPort {
  create(salesDayId: string, customerId: string): Promise<SaleModel>;
  addItem(saleId: string, productId: string, quantity: number): Promise<SaleModel>;
  updateQuantity(saleId: string, productId: string, quantity: number): Promise<SaleModel>;
  updateName(saleId: string, productId: string, itemName: string): Promise<SaleModel>;
  removeItem(saleId: string, productId: string): Promise<SaleModel>;
}
