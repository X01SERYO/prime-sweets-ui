import type { RetailDayModel, RetailDayPage } from '@/modules/retail-sales/domain/models/retailDay';

export interface RetailDayPort {
  getToday(): Promise<RetailDayModel>;
  addItem(productId: string, quantity: number): Promise<RetailDayModel>;
  setQuantity(productId: string, quantity: number): Promise<RetailDayModel>;
  removeItem(productId: string): Promise<RetailDayModel>;
  list(status: 'UNREVIEWED' | 'REVIEWED', page: number, pageSize: number): Promise<RetailDayPage>;
  review(dates: string[]): Promise<void>;
}
