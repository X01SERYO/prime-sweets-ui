import type { LoadSheetQueryPort } from '@/modules/fulfillment-output/application/ports/loadSheetQuery.port';
import type { LoadSheetLineModel } from '@/modules/fulfillment-output/domain/models/loadSheetLine';

export class ListLoadSheetUseCase {
  private readonly query: LoadSheetQueryPort;

  constructor(query: LoadSheetQueryPort) {
    this.query = query;
  }

  execute(): LoadSheetLineModel[] {
    return this.query.list();
  }
}
