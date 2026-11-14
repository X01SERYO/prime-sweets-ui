import type { RetailProductSearchPort } from '@/modules/retail-sales/application/ports/retailProductSearch.port';
import type { RetailProductOption } from '@/modules/retail-sales/domain/models/retailDay';
import { isProductSearchTerm } from '@/modules/catalog/domain/productSearchTerm';

export class SearchRetailProductsUseCase {
  private readonly searchPort: RetailProductSearchPort;

  constructor(searchPort: RetailProductSearchPort) {
    this.searchPort = searchPort;
  }

  async execute(query: string): Promise<RetailProductOption[]> {
    const term = query.trim();
    if (!isProductSearchTerm(term)) {
      return [];
    }
    return this.searchPort.search(term);
  }
}
