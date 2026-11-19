import type { CatalogProductPort } from '@/modules/catalog/application/ports/catalogProduct.port';
import type { CatalogProduct, CatalogProductCreate } from '@/modules/catalog/domain/models/catalogProduct';

export class CreateCatalogProductUseCase {
  private readonly catalog: CatalogProductPort;

  constructor(catalog: CatalogProductPort) {
    this.catalog = catalog;
  }

  async execute(input: CatalogProductCreate): Promise<CatalogProduct> {
    return this.catalog.create(input);
  }
}
