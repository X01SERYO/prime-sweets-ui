export interface CatalogProduct {
  id: string;
  code: string;
  name: string | null;
  brandName: string | null;
  units: number;
  pack: number;
  wholesaleCost: number | null;
  wholesalePrice: number | null;
  retailCost: number | null;
  retailPrice: number | null;
}

export interface CatalogProductPatch {
  wholesaleCost?: number;
  wholesalePrice?: number;
  retailCost?: number;
  retailPrice?: number;
  units?: number;
  pack?: number;
}
