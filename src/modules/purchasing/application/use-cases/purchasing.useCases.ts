import type { PurchasingPort } from '@/modules/purchasing/application/ports/purchasing.port';
import type { PurchaseOrder, PurchaseOrderPage } from '@/modules/purchasing/domain/models/purchaseOrder';
import type { SupplierListItem, SupplierSheet } from '@/modules/purchasing/domain/models/supplier';

export class ListSuppliersUseCase {
  private readonly purchasing: PurchasingPort;

  constructor(purchasing: PurchasingPort) {
    this.purchasing = purchasing;
  }

  execute(): Promise<SupplierListItem[]> {
    return this.purchasing.listSuppliers();
  }
}

export class CreateSupplierUseCase {
  private readonly purchasing: PurchasingPort;

  constructor(purchasing: PurchasingPort) {
    this.purchasing = purchasing;
  }

  execute(name: string): Promise<{ id: string; name: string }> {
    return this.purchasing.createSupplier(name);
  }
}

export class RenameSupplierUseCase {
  private readonly purchasing: PurchasingPort;

  constructor(purchasing: PurchasingPort) {
    this.purchasing = purchasing;
  }

  execute(id: string, name: string): Promise<void> {
    return this.purchasing.renameSupplier(id, name);
  }
}

export class GetSupplierUseCase {
  private readonly purchasing: PurchasingPort;

  constructor(purchasing: PurchasingPort) {
    this.purchasing = purchasing;
  }

  execute(id: string): Promise<SupplierSheet> {
    return this.purchasing.getSupplier(id);
  }
}

export class SetSupplierProductsUseCase {
  private readonly purchasing: PurchasingPort;

  constructor(purchasing: PurchasingPort) {
    this.purchasing = purchasing;
  }

  execute(id: string, productIds: string[]): Promise<SupplierSheet> {
    return this.purchasing.setSupplierProducts(id, productIds);
  }
}

export class CreatePurchaseOrderUseCase {
  private readonly purchasing: PurchasingPort;

  constructor(purchasing: PurchasingPort) {
    this.purchasing = purchasing;
  }

  execute(
    supplierId: string,
    lines: { productId: string; quantity: number; itemName?: string }[],
    assortment: { productId: string; itemName: string }[] = []
  ): Promise<PurchaseOrder> {
    return this.purchasing.createPurchaseOrder(supplierId, lines, assortment);
  }
}

export class UpdatePurchaseOrderUseCase {
  private readonly purchasing: PurchasingPort;

  constructor(purchasing: PurchasingPort) {
    this.purchasing = purchasing;
  }

  execute(
    orderId: string,
    lines: { productId: string; quantity: number; itemName?: string }[],
    assortment: { productId: string; itemName: string }[] = []
  ): Promise<PurchaseOrder> {
    return this.purchasing.updatePurchaseOrder(orderId, lines, assortment);
  }
}

export class ListPurchaseOrdersUseCase {
  private readonly purchasing: PurchasingPort;

  constructor(purchasing: PurchasingPort) {
    this.purchasing = purchasing;
  }

  execute(supplierId: string, page: number, pageSize: number): Promise<PurchaseOrderPage> {
    return this.purchasing.listPurchaseOrders(supplierId, page, pageSize);
  }
}

export class GetPurchaseOrderUseCase {
  private readonly purchasing: PurchasingPort;

  constructor(purchasing: PurchasingPort) {
    this.purchasing = purchasing;
  }

  execute(id: string): Promise<PurchaseOrder> {
    return this.purchasing.getPurchaseOrder(id);
  }
}
