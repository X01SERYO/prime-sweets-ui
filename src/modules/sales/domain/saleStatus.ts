import type { SaleStatus } from '@/modules/sales/domain/models/sale';

export function canEditSaleLines(status: SaleStatus): boolean {
  return status === 'DRAFT' || status === 'CONFIRMED';
}

export function canRenameSaleLine(status: SaleStatus): boolean {
  return status === 'DRAFT';
}

export function canConfirmSale(status: SaleStatus): boolean {
  return status === 'DRAFT';
}

export function canVoidSale(status: SaleStatus): boolean {
  return status === 'CONFIRMED';
}

export function canPreviewInvoice(status: SaleStatus): boolean {
  return status === 'CONFIRMED';
}
