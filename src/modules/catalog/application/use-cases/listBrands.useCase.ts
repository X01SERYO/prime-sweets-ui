import type { BrandPort } from '@/modules/catalog/application/ports/brand.port';
import type { Brand } from '@/modules/catalog/domain/models/brand';

export class ListBrandsUseCase {
  constructor(private readonly brands: BrandPort) {}

  async execute(): Promise<Brand[]> {
    const found = await this.brands.list();
    return [...found].sort((left, right) => left.name.localeCompare(right.name, 'es'));
  }
}
