import type { CatalogProductPage, CatalogProductPort } from '@/modules/catalog/application/ports/catalogProduct.port';
import { isProductSearchTerm } from '@/modules/catalog/domain/productSearchTerm';

export class SearchCatalogProductsUseCase {
  constructor(private readonly catalog: CatalogProductPort) {}

  async execute(page: number, pageSize: number, query?: string): Promise<CatalogProductPage> {
    const term = query?.trim() ?? '';
    if (term && !isProductSearchTerm(term)) {
      throw new Error('SEARCH_TOO_SHORT');
    }
    return this.catalog.list(page, pageSize, term || undefined);
  }
}