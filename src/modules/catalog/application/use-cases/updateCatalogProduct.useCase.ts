import type { CatalogProductPort } from '@/modules/catalog/application/ports/catalogProduct.port';
import type { CatalogProduct, CatalogProductPatch } from '@/modules/catalog/domain/models/catalogProduct';

export class UpdateCatalogProductUseCase {
  private readonly catalog: CatalogProductPort;

  constructor(catalog: CatalogProductPort) {
    this.catalog = catalog;
  }

  async execute(id: string, patch: CatalogProductPatch): Promise<CatalogProduct> {
    return this.catalog.update(id, patch);
  }
}
