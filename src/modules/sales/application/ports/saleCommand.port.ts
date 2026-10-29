import type { SaleModel } from '@/modules/sales/domain/models/sale';

export interface SaleCommandPort {
  create(salesDayId: string, customerId: string): Promise<SaleModel>;
  addItem(saleId: string, productId: string, quantity: number, itemName: string): Promise<SaleModel>;
  updateQuantity(saleId: string, itemId: string, quantity: number): Promise<SaleModel>;
  updateName(saleId: string, itemId: string, itemName: string): Promise<SaleModel>;
  removeItem(saleId: string, itemId: string): Promise<SaleModel>;
  confirm(saleId: string): Promise<SaleModel>;
  void(saleId: string): Promise<SaleModel>;
}
