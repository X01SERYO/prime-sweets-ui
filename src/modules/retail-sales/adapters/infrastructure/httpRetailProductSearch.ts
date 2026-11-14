import type { RetailProductSearchPort } from '@/modules/retail-sales/application/ports/retailProductSearch.port';
import { toRetailProductOption } from '@/modules/retail-sales/adapters/infrastructure/retailDayMapper';
import { RetailInvalidError } from '@/modules/retail-sales/domain/errors/retailInvalid.error';
import type { RetailProductOption } from '@/modules/retail-sales/domain/models/retailDay';
import type { HttpClient } from '@/shared/infrastructure/http/httpClient';

interface Envelope {
  success?: unknown;
  data?: unknown;
}

export class HttpRetailProductSearch implements RetailProductSearchPort {
  private readonly http: HttpClient;

  constructor(http: HttpClient) {
    this.http = http;
  }

  async search(query: string): Promise<RetailProductOption[]> {
    const body = await this.http.get<Envelope>(`/products/search?q=${encodeURIComponent(query)}`);
    if (!body || body.success !== true || !Array.isArray(body.data)) {
      throw new RetailInvalidError();
    }
    return body.data.map(item => toRetailProductOption(item));
  }
}
