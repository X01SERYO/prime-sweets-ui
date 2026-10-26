import { SampleInvoiceQuery } from '@/modules/fulfillment-output/adapters/infrastructure/sampleInvoiceQuery';
import { SampleLoadSheetQuery } from '@/modules/fulfillment-output/adapters/infrastructure/sampleLoadSheetQuery';
import { ListInvoicesUseCase } from '@/modules/fulfillment-output/application/use-cases/listInvoices.useCase';
import { ListLoadSheetUseCase } from '@/modules/fulfillment-output/application/use-cases/listLoadSheet.useCase';

export const listLoadSheet = new ListLoadSheetUseCase(new SampleLoadSheetQuery());
export const listInvoices = new ListInvoicesUseCase(new SampleInvoiceQuery());
