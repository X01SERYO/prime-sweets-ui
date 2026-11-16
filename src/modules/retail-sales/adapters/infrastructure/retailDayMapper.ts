import { RetailInvalidError } from '@/modules/retail-sales/domain/errors/retailInvalid.error';
import type { RetailDayItem, RetailDayModel, RetailDayPage, RetailDayStatus, RetailProductOption } from '@/modules/retail-sales/domain/models/retailDay';

function text(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function money(value: unknown): number {
  const amount = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(amount)) {
    throw new RetailInvalidError();
  }
  return amount;
}

function optionalMoney(value: unknown): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const amount = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(amount) ? amount : null;
}

function item(value: unknown): RetailDayItem {
  if (!value || typeof value !== 'object') {
    throw new RetailInvalidError();
  }
  const row = value as Record<string, unknown>;
  if (typeof row.productId !== 'string' || !Number.isInteger(row.quantity)) {
    throw new RetailInvalidError();
  }
  return {
    productId: row.productId,
    productCode: text(row.productCode),
    brandName: text(row.brandName),
    productName: text(row.productName),
    retailPrice: money(row.retailPrice),
    quantity: row.quantity as number,
    totalPrice: money(row.totalPrice),
    profit: money(row.profit),
    hasCost: row.hasCost === true
  };
}

export function toRetailDay(value: unknown): RetailDayModel {
  if (!value || typeof value !== 'object') {
    throw new RetailInvalidError();
  }
  const day = value as Record<string, unknown>;
  const status = day.status === 'REVIEWED' ? 'REVIEWED' : day.status === 'UNREVIEWED' ? 'UNREVIEWED' : null;
  if (typeof day.businessDate !== 'string' || status === null || !Array.isArray(day.items)) {
    throw new RetailInvalidError();
  }
  return {
    id: typeof day.id === 'string' ? day.id : null,
    businessDate: day.businessDate,
    editable: day.editable === true,
    status: status as RetailDayStatus,
    reviewedAt: typeof day.reviewedAt === 'string' ? day.reviewedAt : null,
    reviewedByName: typeof day.reviewedByName === 'string' ? day.reviewedByName : null,
    totalAmount: money(day.totalAmount),
    totalProfit: money(day.totalProfit),
    items: day.items.map(item)
  };
}

export function toRetailProductOption(value: unknown): RetailProductOption {
  if (!value || typeof value !== 'object') {
    throw new RetailInvalidError();
  }
  const product = value as Record<string, unknown>;
  if (typeof product.id !== 'string') {
    throw new RetailInvalidError();
  }
  const retailPrice = optionalMoney(product.retailPrice);
  const retailCost = optionalMoney(product.retailCost);
  return {
    id: product.id,
    code: text(product.code) || text(product.alegraId),
    brandName: text(product.brandName),
    name: text(product.name),
    retailPrice,
    hasCost: retailCost !== null && retailCost > 0
  };
}

export function toRetailDayPage(value: unknown): RetailDayPage {
  if (!value || typeof value !== 'object') {
    throw new RetailInvalidError();
  }
  const page = value as Record<string, unknown>;
  if (!Array.isArray(page.items) || !Number.isInteger(page.total) || !Number.isInteger(page.page) || !Number.isInteger(page.pageSize)) {
    throw new RetailInvalidError();
  }
  return {
    items: page.items.map(summary),
    total: page.total as number,
    page: page.page as number,
    pageSize: page.pageSize as number
  };
}

function summary(value: unknown) {
  if (!value || typeof value !== 'object') {
    throw new RetailInvalidError();
  }
  const day = value as Record<string, unknown>;
  const status = day.status === 'REVIEWED' || day.status === 'UNREVIEWED' ? day.status : null;
  if (typeof day.businessDate !== 'string' || status === null) {
    throw new RetailInvalidError();
  }
  return {
    businessDate: day.businessDate.slice(0, 10),
    status,
    totalAmount: money(day.totalAmount),
    totalProfit: money(day.totalProfit),
    reviewedAt: typeof day.reviewedAt === 'string' ? day.reviewedAt : null,
    reviewedByName: typeof day.reviewedByName === 'string' ? day.reviewedByName : null
  };
}
