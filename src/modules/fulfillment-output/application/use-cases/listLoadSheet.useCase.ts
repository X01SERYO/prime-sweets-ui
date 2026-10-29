import type { LoadSheetQueryPort } from '@/modules/fulfillment-output/application/ports/loadSheetQuery.port';
import { LoadSheetInvalidError } from '@/modules/fulfillment-output/domain/errors/loadSheetInvalid.error';
import type { LoadSheetLineModel } from '@/modules/fulfillment-output/domain/models/loadSheetLine';

export class ListLoadSheetUseCase {
  private readonly query: LoadSheetQueryPort;

  constructor(query: LoadSheetQueryPort) {
    this.query = query;
  }

  async execute(salesDayId: string): Promise<LoadSheetLineModel[]> {
    const id = salesDayId.trim();
    if (!id) {
      throw new LoadSheetInvalidError();
    }
    return this.query.get(id);
  }
}
