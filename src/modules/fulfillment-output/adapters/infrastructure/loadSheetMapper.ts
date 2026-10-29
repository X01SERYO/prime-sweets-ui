import { LoadSheetInvalidError } from '@/modules/fulfillment-output/domain/errors/loadSheetInvalid.error';
import type { LoadSheetLineModel } from '@/modules/fulfillment-output/domain/models/loadSheetLine';

function money(value: unknown): number {
  const amount = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : Number.NaN;
  if (!Number.isFinite(amount)) {
    throw new LoadSheetInvalidError();
  }
  return amount;
}

function moneyOrNull(value: unknown): number | null {
  if (value === null || value === undefined) {
    return null;
  }
  return money(value);
}

export function toLoadSheetLines(raw: unknown): LoadSheetLineModel[] {
  if (!raw || typeof raw !== 'object' || !Array.isArray((raw as { lines?: unknown }).lines)) {
    throw new LoadSheetInvalidError();
  }
  return (raw as { lines: unknown[] }).lines.map(item => {
    if (!item || typeof item !== 'object') {
      throw new LoadSheetInvalidError();
    }
    const line = item as Record<string, unknown>;
    if (typeof line.productId !== 'string' || typeof line.name !== 'string' || typeof line.quantity !== 'number') {
      throw new LoadSheetInvalidError();
    }
    return {
      productId: line.productId,
      brand: typeof line.brand === 'string' ? line.brand : null,
      name: line.name,
      wholesaleCost: moneyOrNull(line.wholesaleCost),
      wholesaleSalePrice: moneyOrNull(line.wholesaleSalePrice),
      quantity: line.quantity,
      totalPrice: money(line.totalPrice),
      profit: money(line.profit)
    };
  });
}
