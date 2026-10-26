import type { SalesDayQueryPort } from '@/modules/sales-day/application/ports/salesDayQuery.port';
import { SalesDaySellerRequiredError } from '@/modules/sales-day/domain/errors/salesDaySellerRequired.error';
import type { SalesDayModel } from '@/modules/sales-day/domain/models/salesDay';

export class GetCurrentSalesDayUseCase {
  private readonly query: SalesDayQueryPort;

  constructor(query: SalesDayQueryPort) {
    this.query = query;
  }

  async execute(sellerId: string): Promise<SalesDayModel | null> {
    const id = sellerId.trim();
    if (!id) {
      throw new SalesDaySellerRequiredError();
    }
    return this.query.getCurrent(id);
  }
}
