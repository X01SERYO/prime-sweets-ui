import type { BrandPort } from '@/modules/catalog/application/ports/brand.port';
import type { Brand } from '@/modules/catalog/domain/models/brand';

export class CreateBrandUseCase {
  constructor(private readonly brands: BrandPort) {}

  async execute(input: { name: string; code: string }): Promise<Brand> {
    return this.brands.create(input);
  }
}
