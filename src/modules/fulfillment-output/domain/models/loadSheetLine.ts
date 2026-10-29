export interface LoadSheetLineModel {
  productId: string;
  brand: string | null;
  name: string;
  wholesaleCost: number | null;
  wholesaleSalePrice: number | null;
  quantity: number;
  totalPrice: number;
  profit: number;
}
