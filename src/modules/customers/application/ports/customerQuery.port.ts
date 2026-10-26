import type { CustomerModel } from '@/modules/customers/domain/models/customer';

export interface CustomerQueryPort {
  list(): CustomerModel[];
}
