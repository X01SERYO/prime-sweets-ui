import { useState } from 'react';
import type { ListCustomersUseCase } from '@/modules/customers/application/use-cases/listCustomers.useCase';
import type { CustomerModel } from '@/modules/customers/domain/models/customer';

export function useCustomerList(listCustomers: ListCustomersUseCase): CustomerModel[] {
  const [customers] = useState(() => listCustomers.execute());
  return customers;
}
