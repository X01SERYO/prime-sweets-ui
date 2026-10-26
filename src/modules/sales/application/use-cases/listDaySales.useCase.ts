import type { DaySaleQueryPort } from '@/modules/sales/application/ports/daySaleQuery.port';
import type { DaySaleModel } from '@/modules/sales/domain/models/daySale';

export class ListDaySalesUseCase {
  private readonly query: DaySaleQueryPort;

  constructor(query: DaySaleQueryPort) {
    this.query = query;
  }

  execute(): DaySaleModel[] {
    return this.query.list();
  }
}
