import type { SalesDayQueryPort } from '@/modules/sales-day/application/ports/salesDayQuery.port';
import type { SalesDayModel } from '@/modules/sales-day/domain/models/salesDay';
import { MessageError } from '@/shared/i18n/messageError';

export class GetCurrentSalesDayUseCase {
  private readonly query: SalesDayQueryPort;

  constructor(query: SalesDayQueryPort) {
    this.query = query;
  }

  async execute(sellerId: string): Promise<SalesDayModel | null> {
    const id = sellerId.trim();
    if (!id) {
      throw new MessageError('salesDaySellerRequired');
    }
    return this.query.getCurrent(id);
  }
}
