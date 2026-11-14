import type { RetailDayPort } from '@/modules/retail-sales/application/ports/retailDay.port';
import { RetailInvalidError } from '@/modules/retail-sales/domain/errors/retailInvalid.error';
import type { RetailDayModel } from '@/modules/retail-sales/domain/models/retailDay';
import { toRetailDay, toRetailDayPage } from '@/modules/retail-sales/adapters/infrastructure/retailDayMapper';
import type { RetailDayPage } from '@/modules/retail-sales/domain/models/retailDay';
import { HttpRequestError, type HttpClient } from '@/shared/infrastructure/http/httpClient';

interface Envelope {
  success?: unknown;
  data?: unknown;
  code?: unknown;
}

function readDay(body: Envelope): RetailDayModel {
  if (!body || body.success !== true) {
    throw new RetailInvalidError(typeof body?.code === 'string' ? body.code : 'RETAIL_INVALID');
  }
  return toRetailDay(body.data);
}

function rethrow(error: unknown): never {
  if (error instanceof HttpRequestError) {
    throw new RetailInvalidError(error.code ?? 'RETAIL_FAILED');
  }
  throw error;
}

export class HttpRetailDay implements RetailDayPort {
  private readonly http: HttpClient;

  constructor(http: HttpClient) {
    this.http = http;
  }

  async getToday(): Promise<RetailDayModel> {
    try {
      return readDay(await this.http.get<Envelope>('/retail-days/today'));
    } catch (error) {
      rethrow(error);
    }
  }

  async addItem(productId: string, quantity: number): Promise<RetailDayModel> {
    try {
      return readDay(await this.http.post<Envelope>('/retail-days/today/items', { productId, quantity }));
    } catch (error) {
      rethrow(error);
    }
  }

  async setQuantity(productId: string, quantity: number): Promise<RetailDayModel> {
    try {
      return readDay(
        await this.http.patch<Envelope>(`/retail-days/today/items/${encodeURIComponent(productId)}`, { quantity })
      );
    } catch (error) {
      rethrow(error);
    }
  }

  async removeItem(productId: string): Promise<RetailDayModel> {
    try {
      return readDay(await this.http.delete<Envelope>(`/retail-days/today/items/${encodeURIComponent(productId)}`));
    } catch (error) {
      rethrow(error);
    }
  }

  async list(status: 'UNREVIEWED' | 'REVIEWED', page: number, pageSize: number): Promise<RetailDayPage> {
    try {
      const body = await this.http.get<Envelope>(
        `/retail-days?status=${status}&page=${page}&pageSize=${pageSize}`
      );
      if (!body || body.success !== true) {
        throw new RetailInvalidError();
      }
      return toRetailDayPage(body.data);
    } catch (error) {
      rethrow(error);
    }
  }

  async review(dates: string[]): Promise<void> {
    try {
      const body = await this.http.post<Envelope>('/retail-days/review', { dates });
      if (!body || body.success !== true) {
        throw new RetailInvalidError(typeof body?.code === 'string' ? body.code : 'RETAIL_INVALID');
      }
    } catch (error) {
      rethrow(error);
    }
  }
}
