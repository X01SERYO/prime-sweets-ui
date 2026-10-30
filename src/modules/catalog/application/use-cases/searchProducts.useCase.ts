import type { ProductSearchPort } from '@/modules/catalog/application/ports/productSearch.port';
import type { ProductHit } from '@/modules/catalog/domain/models/productHit';
import { isProductSearchTerm } from '@/modules/catalog/domain/productSearchTerm';

export class SearchProductsUseCase {
  private readonly searchPort: ProductSearchPort;

  constructor(searchPort: ProductSearchPort) {
    this.searchPort = searchPort;
  }

  async execute(query: string): Promise<ProductHit[]> {
    const term = query.trim();
    if (!isProductSearchTerm(term)) {
      return [];
    }
    return this.searchPort.search(term);
  }
}
