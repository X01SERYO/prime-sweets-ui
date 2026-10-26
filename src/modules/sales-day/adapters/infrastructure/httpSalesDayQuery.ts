import type { SalesDayQueryPort } from '@/modules/sales-day/application/ports/salesDayQuery.port';
import type { SalesDayModel, SalesDayStatus } from '@/modules/sales-day/domain/models/salesDay';
import { SalesDayInvalidError } from '@/modules/sales-day/domain/errors/salesDayInvalid.error';
import { HttpRequestError, type HttpClient } from '@/shared/infrastructure/http/httpClient';

interface Envelope {
  success?: unknown;
  data?: unknown;
}

export class HttpSalesDayQuery implements SalesDayQueryPort {
  private readonly http: HttpClient;

  constructor(http: HttpClient) {
    this.http = http;
  }

  async getCurrent(sellerId: string): Promise<SalesDayModel | null> {
    try {
      const body = await this.http.get<Envelope>(`/sales-days/current?sellerId=${encodeURIComponent(sellerId)}`);
      const day = readSalesDay(body);
      if (!day) {
        throw new SalesDayInvalidError();
      }
      return day;
    } catch (error) {
      if (error instanceof HttpRequestError && (error.status === 404 || error.code === 'SALES_DAY_NOT_FOUND')) {
        return null;
      }
      throw error;
    }
  }
}

function readSalesDay(body: Envelope): SalesDayModel | null {
  if (!body || body.success !== true || !body.data || typeof body.data !== 'object') {
    return null;
  }
  const data = body.data as Partial<SalesDayModel>;
  if (typeof data.id !== 'string' || typeof data.sellerId !== 'string' || typeof data.date !== 'string') {
    return null;
  }
  if (data.status !== 'OPEN' && data.status !== 'CLOSED') {
    return null;
  }
  const status: SalesDayStatus = data.status;
  return { id: data.id, sellerId: data.sellerId, date: data.date, status };
}
