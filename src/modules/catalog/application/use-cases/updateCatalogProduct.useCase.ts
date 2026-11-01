import type { CatalogProductPort } from '@/modules/catalog/application/ports/catalogProduct.port';
import type { CatalogProduct, CatalogProductPatch } from '@/modules/catalog/domain/models/catalogProduct';

export class UpdateCatalogProductUseCase {
  constructor(private readonly catalog: CatalogProductPort) {}

  async execute(id: string, patch: CatalogProductPatch): Promise<CatalogProduct> {
    return this.catalog.update(id, patch);
  }
}
