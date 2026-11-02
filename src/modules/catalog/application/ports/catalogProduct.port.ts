import type { CatalogProduct, CatalogProductCreate, CatalogProductPatch } from '@/modules/catalog/domain/models/catalogProduct';

export interface CatalogProductPage {
  items: CatalogProduct[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CatalogProductPort {
  list(page: number, pageSize: number, query?: string): Promise<CatalogProductPage>;
  update(id: string, patch: CatalogProductPatch): Promise<CatalogProduct>;
  create(input: CatalogProductCreate): Promise<CatalogProduct>;
}
