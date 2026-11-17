import { PurchaseInvalidError } from '@/modules/purchasing/domain/errors/purchaseInvalid.error';
import type { PurchaseOrder, PurchaseOrderPage } from '@/modules/purchasing/domain/models/purchaseOrder';
import type { SupplierListItem, SupplierSheet } from '@/modules/purchasing/domain/models/supplier';

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object') {
    throw new PurchaseInvalidError();
  }
  return value as Record<string, unknown>;
}

function text(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function numberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function toSupplierList(value: unknown): SupplierListItem[] {
  if (!Array.isArray(value)) throw new PurchaseInvalidError();
  return value.map(item => {
    const row = record(item);
    return {
      id: text(row.id),
      name: text(row.name),
      productCount: Number(row.productCount) || 0,
      latestOrderId: row.latestOrderId == null || row.latestOrderId === '' ? null : text(row.latestOrderId)
    };
  });
}

export function toSupplierSheet(value: unknown): SupplierSheet {
  const row = record(value);
  const products = Array.isArray(row.products) ? row.products : [];
  return {
    id: text(row.id),
    name: text(row.name),
    products: products.map(item => {
      const product = record(item);
      return {
        productId: text(product.productId),
        productCode: product.productCode == null ? null : text(product.productCode),
        brandName: product.brandName == null ? null : text(product.brandName),
        productName: product.productName == null ? null : text(product.productName),
        unitCost: numberOrNull(product.unitCost),
        previousQuantity: numberOrNull(product.previousQuantity),
        lastQuantity: numberOrNull(product.lastQuantity),
        lastItemName: product.lastItemName == null ? null : text(product.lastItemName)
      };
    })
  };
}

export function toPurchaseOrder(value: unknown): PurchaseOrder {
  const row = record(value);
  const lines = Array.isArray(row.lines) ? row.lines : [];
  return {
    id: text(row.id),
    supplierId: text(row.supplierId),
    lineCount: Number(row.lineCount) || lines.length,
    totalCost: Number(row.totalCost) || 0,
    createdAt: text(row.createdAt),
    hasLines: row.hasLines !== false && lines.length > 0,
    lines: lines.map(item => {
      const line = record(item);
      return {
        productId: text(line.productId),
        productCode: text(line.productCode),
        brandName: text(line.brandName),
        catalogName: text(line.catalogName),
        itemName: text(line.itemName),
        unitCost: Number(line.unitCost) || 0,
        quantity: Number(line.quantity) || 0
      };
    })
  };
}

export function toPurchaseOrderPage(value: unknown): PurchaseOrderPage {
  const row = record(value);
  const items = Array.isArray(row.items) ? row.items : [];
  return {
    total: Number(row.total) || 0,
    page: Number(row.page) || 1,
    pageSize: Number(row.pageSize) || 10,
    items: items.map(item => {
      const header = record(item);
      return {
        id: text(header.id),
        supplierId: text(header.supplierId),
        supplierName: text(header.supplierName),
        createdAt: text(header.createdAt),
        lineCount: Number(header.lineCount) || 0,
        totalCost: Number(header.totalCost) || 0,
        hasLines: header.hasLines === true
      };
    })
  };
}
