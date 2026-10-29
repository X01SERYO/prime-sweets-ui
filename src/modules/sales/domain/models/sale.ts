export type SaleStatus = 'DRAFT' | 'CONFIRMED' | 'VOIDED';

export interface SaleItemModel {
  id: string;
  productId: string;
  itemName: string;
  quantity: number;
  wholesalePrice: number;
  lineTotal: number;
}

export interface SaleModel {
  id: string;
  salesDayId: string;
  customerId: string;
  status: SaleStatus;
  invoiceNumber: string | null;
  totalAmount: number;
  totalProfit: number;
  totalQuantity: number;
  createdAt: string;
  items: SaleItemModel[];
}
