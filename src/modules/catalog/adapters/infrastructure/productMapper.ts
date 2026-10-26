import type { ProductHit } from '@/modules/catalog/domain/models/productHit';
import { CatalogInvalidError } from '@/modules/catalog/domain/errors/catalogInvalid.error';

interface ProductDto {
  id?: unknown;
  alegraId?: unknown;
  name?: unknown;
  wholesalePrice?: unknown;
}

function money(value: unknown): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const amount = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(amount) ? amount : null;
}

export function toProductHit(dto: ProductDto): ProductHit {
  if (typeof dto.id !== 'string' || typeof dto.alegraId !== 'string') {
    throw new CatalogInvalidError();
  }
  return {
    id: dto.id,
    name: typeof dto.name === 'string' ? dto.name : null,
    code: dto.alegraId,
    wholesalePrice: money(dto.wholesalePrice)
  };
}
