import type { BrandPort } from '@/modules/catalog/application/ports/brand.port';
import type { Brand } from '@/modules/catalog/domain/models/brand';

export class CreateBrandUseCase {
  private readonly brands: BrandPort;

  constructor(brands: BrandPort) {
    this.brands = brands;
  }

  async execute(input: { name: string; code: string }): Promise<Brand> {
    return this.brands.create(input);
  }
}
