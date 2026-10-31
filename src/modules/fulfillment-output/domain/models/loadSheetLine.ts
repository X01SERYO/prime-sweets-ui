export interface LoadSheetPriceGroupModel {
  wholesaleCost: number;
  wholesaleSalePrice: number;
  quantity: number;
  totalPrice: number;
  profit: number;
}

export interface LoadSheetLineModel {
  productId: string;
  brand: string | null;
  name: string;
  wholesaleCost: number | null;
  wholesaleSalePrice: number | null;
  quantity: number;
  totalPrice: number;
  profit: number;
  priceGroups: LoadSheetPriceGroupModel[];
}
