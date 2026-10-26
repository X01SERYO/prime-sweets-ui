import { useState } from 'react';
import type { ListDaySalesUseCase } from '@/modules/sales/application/use-cases/listDaySales.useCase';
import type { DaySaleModel } from '@/modules/sales/domain/models/daySale';

export function useDaySales(listDaySales: ListDaySalesUseCase): DaySaleModel[] {
  const [sales] = useState(() => listDaySales.execute());
  return sales;
}
