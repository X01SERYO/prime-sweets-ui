import type { CustomerModel } from '@/modules/customers/domain/models/customer';

export interface CustomerQueryPort {
  search(query: string): Promise<CustomerModel[]>;
  get(id: string): Promise<CustomerModel>;
}
