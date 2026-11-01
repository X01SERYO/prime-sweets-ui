import type { CatalogProduct } from '@/modules/catalog/domain/models/catalogProduct';
import { CatalogInvalidError } from '@/modules/catalog/domain/errors/catalogInvalid.error';

function money(value: unknown): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const amount = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(amount) ? amount : null;
}

function count(value: unknown): number {
  const amount = typeof value === 'number' ? value : Number(value);
  return Number.isInteger(amount) && amount >= 0 ? amount : 0;
}

export function toCatalogProduct(dto: unknown): CatalogProduct {
  if (!dto || typeof dto !== 'object') {
    throw new CatalogInvalidError();
  }
  const record = dto as Record<string, unknown>;
  if (typeof record.id !== 'string') {
    throw new CatalogInvalidError();
  }
  const code = typeof record.code === 'string' && record.code.trim() ? record.code : '';
  return {
    id: record.id,
    code,
    name: typeof record.name === 'string' ? record.name : null,
    brandName: typeof record.brandName === 'string' ? record.brandName : null,
    units: count(record.units),
    pack: count(record.pack),
    wholesaleCost: money(record.wholesaleCost),
    wholesalePrice: money(record.wholesalePrice),
    retailCost: money(record.retailCost),
    retailPrice: money(record.retailPrice)
  };
}
