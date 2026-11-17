import type { PurchaseOrder, PurchaseOrderPage } from '@/modules/purchasing/domain/models/purchaseOrder';
import type { SupplierListItem, SupplierSheet } from '@/modules/purchasing/domain/models/supplier';

export interface PurchasingPort {
  listSuppliers(): Promise<SupplierListItem[]>;
  createSupplier(name: string): Promise<{ id: string; name: string }>;
  renameSupplier(id: string, name: string): Promise<void>;
  getSupplier(id: string): Promise<SupplierSheet>;
  setSupplierProducts(id: string, productIds: string[]): Promise<SupplierSheet>;
  createPurchaseOrder(
    supplierId: string,
    lines: { productId: string; quantity: number; itemName?: string }[]
  ): Promise<PurchaseOrder>;
  updatePurchaseOrder(
    orderId: string,
    lines: { productId: string; quantity: number; itemName?: string }[]
  ): Promise<PurchaseOrder>;
  listPurchaseOrders(supplierId: string, page: number, pageSize: number): Promise<PurchaseOrderPage>;
  getPurchaseOrder(id: string): Promise<PurchaseOrder>;
}
