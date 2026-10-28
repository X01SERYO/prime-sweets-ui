import type { CustomerQueryPort } from '@/modules/customers/application/ports/customerQuery.port';
import { CustomerInvalidError } from '@/modules/customers/domain/errors/customerInvalid.error';
import type { CustomerModel } from '@/modules/customers/domain/models/customer';

export class GetCustomerUseCase {
  private readonly query: CustomerQueryPort;

  constructor(query: CustomerQueryPort) {
    this.query = query;
  }

  async execute(id: string): Promise<CustomerModel> {
    const customerId = id.trim();
    if (!customerId) {
      throw new CustomerInvalidError();
    }
    return this.query.get(customerId);
  }
}
