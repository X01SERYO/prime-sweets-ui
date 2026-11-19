import type { CatalogProductPage, CatalogProductPort } from '@/modules/catalog/application/ports/catalogProduct.port';

export class SearchCatalogProductsUseCase {
  private readonly catalog: CatalogProductPort;

  constructor(catalog: CatalogProductPort) {
    this.catalog = catalog;
  }

  async execute(page: number, pageSize: number, query?: string, brands?: string[]): Promise<CatalogProductPage> {
    const term = query?.trim() ?? '';
    return this.catalog.list(page, pageSize, term || undefined, brands);
  }
}