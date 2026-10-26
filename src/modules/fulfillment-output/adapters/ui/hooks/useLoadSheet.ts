import { useState } from 'react';
import type { ListLoadSheetUseCase } from '@/modules/fulfillment-output/application/use-cases/listLoadSheet.useCase';
import type { LoadSheetLineModel } from '@/modules/fulfillment-output/domain/models/loadSheetLine';

export function useLoadSheet(listLoadSheet: ListLoadSheetUseCase): LoadSheetLineModel[] {
  const [lines] = useState(() => listLoadSheet.execute());
  return lines;
}
