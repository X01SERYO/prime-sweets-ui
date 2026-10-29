import { SampleInvoiceQuery } from '@/modules/fulfillment-output/adapters/infrastructure/sampleInvoiceQuery';
import { ListInvoicesUseCase } from '@/modules/fulfillment-output/application/use-cases/listInvoices.useCase';

export const listInvoices = new ListInvoicesUseCase(new SampleInvoiceQuery());
