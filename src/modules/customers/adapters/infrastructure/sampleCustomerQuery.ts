import type { CustomerQueryPort } from '@/modules/customers/application/ports/customerQuery.port';
import type { CustomerModel } from '@/modules/customers/domain/models/customer';

const customers: CustomerModel[] = [
  { id: 'c1', name: 'Tienda Doña Rosa', document: 'CC 52123456' },
  { id: 'c2', name: 'Minimercado El Vecino', document: 'NIT 900123456' },
  { id: 'c3', name: 'Supertienda La 80', document: 'CC 43890123' }
];

export class SampleCustomerQuery implements CustomerQueryPort {
  list(): CustomerModel[] {
    return customers;
  }
}
