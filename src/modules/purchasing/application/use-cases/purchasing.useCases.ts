import type { PurchasingPort } from '@/modules/purchasing/application/ports/purchasing.port';
import type { PurchaseOrder, PurchaseOrderPage } from '@/modules/purchasing/domain/models/purchaseOrder';
import type { SupplierListItem, SupplierSheet } from '@/modules/purchasing/domain/models/supplier';

export class ListSuppliersUseCase {
  constructor(private readonly purchasing: PurchasingPort) {}

  execute(): Promise<SupplierListItem[]> {
    return this.purchasing.listSuppliers();
  }
}

export class CreateSupplierUseCase {
  constructor(private readonly purchasing: PurchasingPort) {}

  execute(name: string): Promise<{ id: string; name: string }> {
    return this.purchasing.createSupplier(name);
  }
}

export class RenameSupplierUseCase {
  constructor(private readonly purchasing: PurchasingPort) {}

  execute(id: string, name: string): Promise<void> {
    return this.purchasing.renameSupplier(id, name);
  }
}

export class GetSupplierUseCase {
  constructor(private readonly purchasing: PurchasingPort) {}

  execute(id: string): Promise<SupplierSheet> {
    return this.purchasing.getSupplier(id);
  }
}

export class SetSupplierProductsUseCase {
  constructor(private readonly purchasing: PurchasingPort) {}

  execute(id: string, productIds: string[]): Promise<SupplierSheet> {
    return this.purchasing.setSupplierProducts(id, productIds);
  }
}

export class CreatePurchaseOrderUseCase {
  constructor(private readonly purchasing: PurchasingPort) {}

  execute(
    supplierId: string,
    lines: { productId: string; quantity: number; itemName?: string }[]
  ): Promise<PurchaseOrder> {
    return this.purchasing.createPurchaseOrder(supplierId, lines);
  }
}

export class UpdatePurchaseOrderUseCase {
  constructor(private readonly purchasing: PurchasingPort) {}

  execute(
    orderId: string,
    lines: { productId: string; quantity: number; itemName?: string }[]
  ): Promise<PurchaseOrder> {
    return this.purchasing.updatePurchaseOrder(orderId, lines);
  }
}

export class ListPurchaseOrdersUseCase {
  constructor(private readonly purchasing: PurchasingPort) {}

  execute(supplierId: string, page: number, pageSize: number): Promise<PurchaseOrderPage> {
    return this.purchasing.listPurchaseOrders(supplierId, page, pageSize);
  }
}

export class GetPurchaseOrderUseCase {
  constructor(private readonly purchasing: PurchasingPort) {}

  execute(id: string): Promise<PurchaseOrder> {
    return this.purchasing.getPurchaseOrder(id);
  }
}
