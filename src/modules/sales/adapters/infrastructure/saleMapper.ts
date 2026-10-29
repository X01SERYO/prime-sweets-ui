import { SaleInvalidError } from '@/modules/sales/domain/errors/saleInvalid.error';
import type { SaleItemModel, SaleModel, SaleStatus } from '@/modules/sales/domain/models/sale';

function money(value: unknown): number {
  const amount = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : Number.NaN;
  if (!Number.isFinite(amount)) {
    throw new SaleInvalidError();
  }
  return amount;
}

function toItem(raw: unknown): SaleItemModel {
  if (!raw || typeof raw !== 'object') {
    throw new SaleInvalidError();
  }
  const data = raw as Record<string, unknown>;
  if (
    typeof data.id !== 'string' ||
    typeof data.productId !== 'string' ||
    typeof data.itemName !== 'string' ||
    typeof data.quantity !== 'number'
  ) {
    throw new SaleInvalidError();
  }
  return {
    id: data.id,
    productId: data.productId,
    itemName: data.itemName,
    quantity: data.quantity,
    wholesalePrice: money(data.wholesalePrice),
    lineTotal: money(data.totalPrice)
  };
}

export function toSale(raw: unknown): SaleModel {
  if (!raw || typeof raw !== 'object') {
    throw new SaleInvalidError();
  }
  const data = raw as Record<string, unknown>;
  if (
    typeof data.id !== 'string' ||
    typeof data.salesDayId !== 'string' ||
    typeof data.customerId !== 'string' ||
    (data.status !== 'DRAFT' && data.status !== 'CONFIRMED' && data.status !== 'VOIDED') ||
    !Array.isArray(data.items)
  ) {
    throw new SaleInvalidError();
  }
  const status: SaleStatus = data.status;
  return {
    id: data.id,
    salesDayId: data.salesDayId,
    customerId: data.customerId,
    status,
    invoiceNumber: typeof data.invoiceNumber === 'string' ? data.invoiceNumber : null,
    totalAmount: money(data.totalAmount),
    totalProfit: money(data.totalProfit),
    totalQuantity: money(data.totalQuantity),
    createdAt: typeof data.createdAt === 'string' ? data.createdAt : '',
    items: data.items.map(item => toItem(item))
  };
}

export function toSaleEnvelope(body: { success?: unknown; data?: unknown } | null): SaleModel {
  if (!body || body.success !== true) {
    throw new SaleInvalidError();
  }
  return toSale(body.data);
}
