export interface SupplierListItem {
  id: string;
  name: string;
  productCount: number;
  latestOrderId: string | null;
}

export interface SupplierProduct {
  productId: string;
  productCode: string | null;
  brandName: string | null;
  productName: string | null;
  unitCost: number | null;
  previousQuantity: number | null;
  lastQuantity: number | null;
  lastItemName: string | null;
}

export interface SupplierSheet {
  id: string;
  name: string;
  products: SupplierProduct[];
}
