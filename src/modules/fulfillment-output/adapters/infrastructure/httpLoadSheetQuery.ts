import { toLoadSheetLines } from '@/modules/fulfillment-output/adapters/infrastructure/loadSheetMapper';
import type { LoadSheetQueryPort } from '@/modules/fulfillment-output/application/ports/loadSheetQuery.port';
import { LoadSheetInvalidError } from '@/modules/fulfillment-output/domain/errors/loadSheetInvalid.error';
import { LoadSheetNotClosedError } from '@/modules/fulfillment-output/domain/errors/loadSheetNotClosed.error';
import type { LoadSheetLineModel } from '@/modules/fulfillment-output/domain/models/loadSheetLine';
import { HttpRequestError, type HttpClient } from '@/shared/infrastructure/http/httpClient';

interface Envelope {
  success?: unknown;
  data?: unknown;
}

export class HttpLoadSheetQuery implements LoadSheetQueryPort {
  private readonly http: HttpClient;

  constructor(http: HttpClient) {
    this.http = http;
  }

  async get(salesDayId: string): Promise<LoadSheetLineModel[]> {
    try {
      const body = await this.http.get<Envelope>(`/load-sheets/${encodeURIComponent(salesDayId)}`);
      if (!body || body.success !== true) {
        throw new LoadSheetInvalidError();
      }
      return toLoadSheetLines(body.data);
    } catch (error) {
      if (error instanceof LoadSheetInvalidError || error instanceof LoadSheetNotClosedError) {
        throw error;
      }
      if (error instanceof HttpRequestError && error.code === 'SALES_DAY_NOT_CLOSED') {
        throw new LoadSheetNotClosedError();
      }
      throw error;
    }
  }
}
