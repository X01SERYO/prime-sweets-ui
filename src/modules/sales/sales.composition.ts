import { SampleDaySaleQuery } from '@/modules/sales/adapters/infrastructure/sampleDaySaleQuery';
import { ListDaySalesUseCase } from '@/modules/sales/application/use-cases/listDaySales.useCase';

export const listDaySales = new ListDaySalesUseCase(new SampleDaySaleQuery());
