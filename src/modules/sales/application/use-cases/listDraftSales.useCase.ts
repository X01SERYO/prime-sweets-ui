import type { SaleQueryPort } from '@/modules/sales/application/ports/saleQuery.port';
import type { SaleModel } from '@/modules/sales/domain/models/sale';

export class ListDraftSalesUseCase {
  private readonly query: SaleQueryPort;

  constructor(query: SaleQueryPort) {
    this.query = query;
  }

  async execute(salesDayId: string, customerId: string): Promise<SaleModel[]> {
    return this.query.listDrafts(salesDayId.trim(), customerId.trim());
  }
}
