import { toSale, toSaleEnvelope } from '@/modules/sales/adapters/infrastructure/saleMapper';
import type { SaleCommandPort } from '@/modules/sales/application/ports/saleCommand.port';
import type { SaleQueryPort } from '@/modules/sales/application/ports/saleQuery.port';
import { DeliveryDateBeforeSaleError } from '@/modules/sales/domain/errors/deliveryDateBeforeSale.error';
import { DeliveryDateRequiredError } from '@/modules/sales/domain/errors/deliveryDateRequired.error';
import { SaleOutsideEditWindowError } from '@/modules/sales/domain/errors/saleOutsideEditWindow.error';
import { SaleAlreadyVoidedError } from '@/modules/sales/domain/errors/saleAlreadyVoided.error';
import { SaleCannotBeModifiedError } from '@/modules/sales/domain/errors/saleCannotBeModified.error';
import { SaleDayClosedError } from '@/modules/sales/domain/errors/saleDayClosed.error';
import { SaleInvalidError } from '@/modules/sales/domain/errors/saleInvalid.error';
import { SaleMustContainItemsError } from '@/modules/sales/domain/errors/saleMustContainItems.error';
import type { SaleModel } from '@/modules/sales/domain/models/sale';
import { HttpRequestError, type HttpClient } from '@/shared/infrastructure/http/httpClient';

interface Envelope {
  success?: unknown;
  data?: unknown;
}

function mapSaleError(error: unknown): never {
  if (
    error instanceof SaleInvalidError ||
    error instanceof SaleDayClosedError ||
    error instanceof SaleMustContainItemsError ||
    error instanceof SaleAlreadyVoidedError ||
    error instanceof SaleCannotBeModifiedError ||
    error instanceof SaleOutsideEditWindowError ||
    error instanceof DeliveryDateRequiredError ||
    error instanceof DeliveryDateBeforeSaleError
  ) {
    throw error;
  }
  if (error instanceof HttpRequestError && error.code === 'SALES_DAY_NOT_OPEN') {
    throw new SaleDayClosedError();
  }
  if (error instanceof HttpRequestError && error.code === 'SALE_MUST_CONTAIN_ITEMS') {
    throw new SaleMustContainItemsError();
  }
  if (error instanceof HttpRequestError && error.code === 'SALE_ALREADY_VOIDED') {
    throw new SaleAlreadyVoidedError();
  }
  if (error instanceof HttpRequestError && error.code === 'SALE_CANNOT_BE_MODIFIED') {
    throw new SaleCannotBeModifiedError();
  }
  if (error instanceof HttpRequestError && error.code === 'SALE_OUTSIDE_EDIT_WINDOW') {
    throw new SaleOutsideEditWindowError();
  }
  if (error instanceof HttpRequestError && error.code === 'DELIVERY_DATE_REQUIRED') {
    throw new DeliveryDateRequiredError();
  }
  if (error instanceof HttpRequestError && error.code === 'DELIVERY_DATE_BEFORE_SALE') {
    throw new DeliveryDateBeforeSaleError();
  }
  throw error;
}

export class HttpSale implements SaleCommandPort, SaleQueryPort {
  private readonly http: HttpClient;

  constructor(http: HttpClient) {
    this.http = http;
  }

  async create(salesDayId: string, customerId: string, deliveryDate: string): Promise<SaleModel> {
    try {
      const body = await this.http.post<Envelope>('/sales', { salesDayId, customerId, deliveryDate });
      return toSaleEnvelope(body);
    } catch (error) {
      mapSaleError(error);
    }
  }

  async listDrafts(salesDayId: string, customerId: string): Promise<SaleModel[]> {
    return this.list(`/sales?salesDayId=${encodeURIComponent(salesDayId)}&customerId=${encodeURIComponent(customerId)}&status=DRAFT`);
  }

  async get(saleId: string): Promise<SaleModel> {
    const body = await this.http.get<Envelope>(`/sales/${encodeURIComponent(saleId)}`);
    return toSaleEnvelope(body);
  }

  async listBySalesDay(salesDayId: string): Promise<SaleModel[]> {
    return this.list(`/sales?salesDayId=${encodeURIComponent(salesDayId)}`);
  }

  private async list(path: string): Promise<SaleModel[]> {
    const body = await this.http.get<Envelope>(path);
    if (!body || body.success !== true || !Array.isArray(body.data)) {
      throw new SaleInvalidError();
    }
    return body.data.map(item => toSale(item));
  }

  async setDeliveryDate(saleId: string, deliveryDate: string): Promise<SaleModel> {
    try {
      const body = await this.http.patch<Envelope>(`/sales/${encodeURIComponent(saleId)}/delivery-date`, { deliveryDate });
      return toSaleEnvelope(body);
    } catch (error) {
      mapSaleError(error);
    }
  }

  async addItem(saleId: string, productId: string, quantity: number, itemName: string): Promise<SaleModel> {
    try {
      const body = await this.http.post<Envelope>(`/sales/${encodeURIComponent(saleId)}/items`, {
        productId,
        quantity,
        itemName
      });
      return toSaleEnvelope(body);
    } catch (error) {
      mapSaleError(error);
    }
  }

  async updateQuantity(saleId: string, itemId: string, quantity: number): Promise<SaleModel> {
    try {
      const body = await this.http.put<Envelope>(
        `/sales/${encodeURIComponent(saleId)}/items/${encodeURIComponent(itemId)}/quantity`,
        { quantity }
      );
      return toSaleEnvelope(body);
    } catch (error) {
      mapSaleError(error);
    }
  }

  async updateName(saleId: string, itemId: string, itemName: string): Promise<SaleModel> {
    try {
      const body = await this.http.put<Envelope>(
        `/sales/${encodeURIComponent(saleId)}/items/${encodeURIComponent(itemId)}/name`,
        { itemName }
      );
      return toSaleEnvelope(body);
    } catch (error) {
      mapSaleError(error);
    }
  }

  async removeItem(saleId: string, itemId: string): Promise<SaleModel> {
    try {
      const body = await this.http.delete<Envelope>(
        `/sales/${encodeURIComponent(saleId)}/items/${encodeURIComponent(itemId)}`
      );
      return toSaleEnvelope(body);
    } catch (error) {
      mapSaleError(error);
    }
  }

  async void(saleId: string): Promise<SaleModel> {
    try {
      const body = await this.http.post<Envelope>(`/sales/${encodeURIComponent(saleId)}/void`, {});
      return toSaleEnvelope(body);
    } catch (error) {
      mapSaleError(error);
    }
  }

  async confirm(saleId: string): Promise<SaleModel> {
    try {
      const body = await this.http.post<Envelope>(`/sales/${encodeURIComponent(saleId)}/confirm`, {});
      return toSaleEnvelope(body);
    } catch (error) {
      mapSaleError(error);
    }
  }
}
