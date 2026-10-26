import type { CustomerQueryPort } from '@/modules/customers/application/ports/customerQuery.port';
import type { CustomerModel } from '@/modules/customers/domain/models/customer';

export class ListCustomersUseCase {
  private readonly query: CustomerQueryPort;

  constructor(query: CustomerQueryPort) {
    this.query = query;
  }

  execute(): CustomerModel[] {
    return this.query.list();
  }
}
