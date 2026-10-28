import type { CustomerQueryPort } from '@/modules/customers/application/ports/customerQuery.port';
import type { CustomerModel } from '@/modules/customers/domain/models/customer';

export class SearchCustomersUseCase {
  private readonly query: CustomerQueryPort;

  constructor(query: CustomerQueryPort) {
    this.query = query;
  }

  async execute(term: string): Promise<CustomerModel[]> {
    const query = term.trim();
    if (!query) {
      return [];
    }
    return this.query.search(query);
  }
}
