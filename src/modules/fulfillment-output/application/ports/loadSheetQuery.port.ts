import type { LoadSheetLineModel } from '@/modules/fulfillment-output/domain/models/loadSheetLine';

export interface LoadSheetQueryPort {
  list(): LoadSheetLineModel[];
}
