import type { SalesDayCommandPort } from '@/modules/sales-day/application/ports/salesDayCommand.port';
import { toSalesDay } from '@/modules/sales-day/adapters/infrastructure/salesDayMapper';
import { SalesDayAlreadyOpenError } from '@/modules/sales-day/domain/errors/salesDayAlreadyOpen.error';
import { SalesDayInvalidError } from '@/modules/sales-day/domain/errors/salesDayInvalid.error';
import type { SalesDayModel } from '@/modules/sales-day/domain/models/salesDay';
import { HttpRequestError, type HttpClient } from '@/shared/infrastructure/http/httpClient';

interface Envelope {
  success?: unknown;
  data?: unknown;
}

export class HttpSalesDayCommand implements SalesDayCommandPort {
  private readonly http: HttpClient;

  constructor(http: HttpClient) {
    this.http = http;
  }

  async open(sellerId: string): Promise<SalesDayModel> {
    try {
      const body = await this.http.post<Envelope>('/sales-days/open', { sellerId });
      const day = toSalesDay(body);
      if (!day) {
        throw new SalesDayInvalidError();
      }
      return day;
    } catch (error) {
      if (error instanceof SalesDayInvalidError) {
        throw error;
      }
      if (error instanceof HttpRequestError && error.code === 'SALES_DAY_ALREADY_OPEN') {
        throw new SalesDayAlreadyOpenError();
      }
      throw error;
    }
  }
}
