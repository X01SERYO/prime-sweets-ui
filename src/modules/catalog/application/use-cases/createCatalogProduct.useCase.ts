import type { CatalogProductPort } from '@/modules/catalog/application/ports/catalogProduct.port';
import type { CatalogProduct, CatalogProductCreate } from '@/modules/catalog/domain/models/catalogProduct';

export class CreateCatalogProductUseCase {
  constructor(private readonly catalog: CatalogProductPort) {}

  async execute(input: CatalogProductCreate): Promise<CatalogProduct> {
    return this.catalog.create(input);
  }
}
