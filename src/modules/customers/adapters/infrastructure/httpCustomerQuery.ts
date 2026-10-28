import { toCustomer, toCustomerList } from '@/modules/customers/adapters/infrastructure/customerMapper';
import type { CustomerQueryPort } from '@/modules/customers/application/ports/customerQuery.port';
import { CustomerInvalidError } from '@/modules/customers/domain/errors/customerInvalid.error';
import { CustomerNotFoundError } from '@/modules/customers/domain/errors/customerNotFound.error';
import type { CustomerModel } from '@/modules/customers/domain/models/customer';
import { HttpRequestError, type HttpClient } from '@/shared/infrastructure/http/httpClient';

interface Envelope {
  success?: unknown;
  data?: unknown;
}

export class HttpCustomerQuery implements CustomerQueryPort {
  private readonly http: HttpClient;

  constructor(http: HttpClient) {
    this.http = http;
  }

  async search(query: string): Promise<CustomerModel[]> {
    const body = await this.http.get<Envelope>(`/customers/search?q=${encodeURIComponent(query)}`);
    if (!body || body.success !== true) {
      throw new CustomerInvalidError();
    }
    return toCustomerList(body.data);
  }

  async get(id: string): Promise<CustomerModel> {
    try {
      const body = await this.http.get<Envelope>(`/customers/${encodeURIComponent(id)}`);
      if (!body || body.success !== true) {
        throw new CustomerInvalidError();
      }
      return toCustomer(body.data);
    } catch (error) {
      if (error instanceof HttpRequestError && error.status === 404) {
        throw new CustomerNotFoundError();
      }
      throw error;
    }
  }
}
