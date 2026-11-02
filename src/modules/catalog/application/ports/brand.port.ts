import type { Brand } from '@/modules/catalog/domain/models/brand';

export interface BrandPort {
  list(): Promise<Brand[]>;
  create(input: { name: string; code: string }): Promise<Brand>;
}
