import { SampleCustomerQuery } from '@/modules/customers/adapters/infrastructure/sampleCustomerQuery';
import { ListCustomersUseCase } from '@/modules/customers/application/use-cases/listCustomers.useCase';

export const listCustomers = new ListCustomersUseCase(new SampleCustomerQuery());
