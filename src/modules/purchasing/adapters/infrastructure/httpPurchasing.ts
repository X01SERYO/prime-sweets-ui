import type { PurchasingPort } from '@/modules/purchasing/application/ports/purchasing.port';
import {
  toPurchaseOrder,
  toPurchaseOrderPage,
  toSupplierList,
  toSupplierSheet
} from '@/modules/purchasing/adapters/infrastructure/purchasingMapper';
import { PurchaseInvalidError } from '@/modules/purchasing/domain/errors/purchaseInvalid.error';
import type { PurchaseOrder, PurchaseOrderPage } from '@/modules/purchasing/domain/models/purchaseOrder';
import type { SupplierListItem, SupplierSheet } from '@/modules/purchasing/domain/models/supplier';
import { HttpRequestError, type HttpClient } from '@/shared/infrastructure/http/httpClient';

interface Envelope {
  success?: unknown;
  data?: unknown;
  code?: unknown;
}

export class HttpPurchasing implements PurchasingPort {
  constructor(private readonly http: HttpClient) {}

  listSuppliers(): Promise<SupplierListItem[]> {
    return this.read('/suppliers', toSupplierList);
  }

  async createSupplier(name: string): Promise<{ id: string; name: string }> {
    const sheet = await this.readPost('/suppliers', { name }, toSupplierSheet);
    return { id: sheet.id, name: sheet.name };
  }

  async renameSupplier(id: string, name: string): Promise<void> {
    await this.readPatch(`/suppliers/${encodeURIComponent(id)}`, { name }, toSupplierSheet);
  }

  getSupplier(id: string): Promise<SupplierSheet> {
    return this.read(`/suppliers/${encodeURIComponent(id)}`, toSupplierSheet);
  }

  setSupplierProducts(id: string, productIds: string[]): Promise<SupplierSheet> {
    return this.readPut(`/suppliers/${encodeURIComponent(id)}/products`, { productIds }, toSupplierSheet);
  }

  createPurchaseOrder(
    supplierId: string,
    lines: { productId: string; quantity: number; itemName?: string }[],
    assortment: { productId: string; itemName: string }[]
  ): Promise<PurchaseOrder> {
    return this.readPost('/purchase-orders', { supplierId, lines, assortment }, toPurchaseOrder);
  }

  updatePurchaseOrder(
    orderId: string,
    lines: { productId: string; quantity: number; itemName?: string }[],
    assortment: { productId: string; itemName: string }[]
  ): Promise<PurchaseOrder> {
    return this.readPatch(`/purchase-orders/${encodeURIComponent(orderId)}`, { lines, assortment }, toPurchaseOrder);
  }

  listPurchaseOrders(supplierId: string, page: number, pageSize: number): Promise<PurchaseOrderPage> {
    const query = `supplierId=${encodeURIComponent(supplierId)}&page=${page}&pageSize=${pageSize}`;
    return this.read(`/purchase-orders?${query}`, toPurchaseOrderPage);
  }

  getPurchaseOrder(id: string): Promise<PurchaseOrder> {
    return this.read(`/purchase-orders/${encodeURIComponent(id)}`, toPurchaseOrder);
  }

  private async read<T>(path: string, map: (value: unknown) => T): Promise<T> {
    try {
      return map(this.data(await this.http.get<Envelope>(path)));
    } catch (error) {
      this.fail(error);
    }
  }

  private async readPost<T>(path: string, body: unknown, map: (value: unknown) => T): Promise<T> {
    try {
      return map(this.data(await this.http.post<Envelope>(path, body)));
    } catch (error) {
      this.fail(error);
    }
  }

  private async readPut<T>(path: string, body: unknown, map: (value: unknown) => T): Promise<T> {
    try {
      return map(this.data(await this.http.put<Envelope>(path, body)));
    } catch (error) {
      this.fail(error);
    }
  }

  private async readPatch<T>(path: string, body: unknown, map: (value: unknown) => T): Promise<T> {
    try {
      return map(this.data(await this.http.patch<Envelope>(path, body)));
    } catch (error) {
      this.fail(error);
    }
  }

  private data(body: Envelope): unknown {
    if (!body || body.success !== true) {
      throw new PurchaseInvalidError(typeof body?.code === 'string' ? body.code : undefined);
    }
    return body.data;
  }

  private fail(error: unknown): never {
    if (error instanceof PurchaseInvalidError) throw error;
    if (error instanceof HttpRequestError) throw new PurchaseInvalidError(error.code);
    throw error;
  }
}
