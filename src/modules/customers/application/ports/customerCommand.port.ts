import type { CustomerModel, NewCustomer } from '@/modules/customers/domain/models/customer';

export interface CustomerCommandPort {
  create(customer: NewCustomer): Promise<CustomerModel>;
}
