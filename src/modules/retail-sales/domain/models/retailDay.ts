export type RetailDayStatus = 'UNREVIEWED' | 'REVIEWED';

export interface RetailDayItem {
  productId: string;
  productCode: string;
  brandName: string;
  productName: string;
  retailPrice: number;
  quantity: number;
  totalPrice: number;
  profit: number;
  hasCost: boolean;
}

export interface RetailDayModel {
  id: string | null;
  businessDate: string;
  editable: boolean;
  status: RetailDayStatus;
  reviewedAt: string | null;
  reviewedByName: string | null;
  totalAmount: number;
  totalProfit: number;
  items: RetailDayItem[];
}

export interface RetailProductOption {
  id: string;
  code: string;
  brandName: string;
  name: string;
  retailPrice: number | null;
  hasCost: boolean;
}

export interface RetailDaySummary {
  businessDate: string;
  status: RetailDayStatus;
  totalAmount: number;
  totalProfit: number;
  reviewedAt: string | null;
  reviewedByName: string | null;
}

export interface RetailDayPage {
  items: RetailDaySummary[];
  total: number;
  page: number;
  pageSize: number;
}
