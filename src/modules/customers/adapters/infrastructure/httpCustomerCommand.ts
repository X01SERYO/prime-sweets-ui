import { toCustomer } from '@/modules/customers/adapters/infrastructure/customerMapper';
import type { CustomerCommandPort } from '@/modules/customers/application/ports/customerCommand.port';
import { CustomerAlreadyExistsError } from '@/modules/customers/domain/errors/customerAlreadyExists.error';
import { CustomerInvalidError } from '@/modules/customers/domain/errors/customerInvalid.error';
import type { CustomerModel, NewCustomer } from '@/modules/customers/domain/models/customer';
import { HttpRequestError, type HttpClient } from '@/shared/infrastructure/http/httpClient';

interface Envelope {
  success?: unknown;
  data?: unknown;
}

export class HttpCustomerCommand implements CustomerCommandPort {
  private readonly http: HttpClient;

  constructor(http: HttpClient) {
    this.http = http;
  }

  async create(customer: NewCustomer): Promise<CustomerModel> {
    try {
      const body = await this.http.post<Envelope>('/customers', customer);
      if (!body || body.success !== true) {
        throw new CustomerInvalidError();
      }
      return toCustomer(body.data);
    } catch (error) {
      if (error instanceof CustomerInvalidError) {
        throw error;
      }
      if (error instanceof HttpRequestError && error.code === 'CUSTOMER_ALREADY_EXISTS') {
        throw new CustomerAlreadyExistsError();
      }
      throw error;
    }
  }
}
