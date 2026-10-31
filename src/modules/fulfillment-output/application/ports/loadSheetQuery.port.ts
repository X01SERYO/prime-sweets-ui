import type { LoadSheetLineModel } from '@/modules/fulfillment-output/domain/models/loadSheetLine';

export interface LoadSheetQueryPort {
  getByDeliveryDate(deliveryDate: string): Promise<LoadSheetLineModel[]>;
}
