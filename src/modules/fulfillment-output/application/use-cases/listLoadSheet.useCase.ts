import type { LoadSheetQueryPort } from '@/modules/fulfillment-output/application/ports/loadSheetQuery.port';
import { LoadSheetInvalidError } from '@/modules/fulfillment-output/domain/errors/loadSheetInvalid.error';
import type { LoadSheetLineModel } from '@/modules/fulfillment-output/domain/models/loadSheetLine';

export class ListLoadSheetUseCase {
  private readonly query: LoadSheetQueryPort;

  constructor(query: LoadSheetQueryPort) {
    this.query = query;
  }

  async execute(deliveryDate: string): Promise<LoadSheetLineModel[]> {
    const date = deliveryDate.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new LoadSheetInvalidError();
    }
    return this.query.getByDeliveryDate(date);
  }
}
