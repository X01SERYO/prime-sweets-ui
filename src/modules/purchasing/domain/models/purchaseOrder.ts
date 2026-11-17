export interface PurchaseOrderLine {
  productId: string;
  productCode: string;
  brandName: string;
  catalogName: string;
  itemName: string;
  unitCost: number;
  quantity: number;
}

export interface PurchaseOrder {
  id: string;
  supplierId: string;
  lines: PurchaseOrderLine[];
  lineCount: number;
  totalCost: number;
  createdAt: string;
  hasLines: boolean;
}

export interface PurchaseOrderHeader {
  id: string;
  supplierId: string;
  supplierName: string;
  createdAt: string;
  lineCount: number;
  totalCost: number;
  hasLines: boolean;
}

export interface PurchaseOrderPage {
  items: PurchaseOrderHeader[];
  total: number;
  page: number;
  pageSize: number;
}
