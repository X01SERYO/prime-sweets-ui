import type { SalesDayCommandPort } from '@/modules/sales-day/application/ports/salesDayCommand.port';
import { SalesDaySellerRequiredError } from '@/modules/sales-day/domain/errors/salesDaySellerRequired.error';
import type { SalesDayModel } from '@/modules/sales-day/domain/models/salesDay';

export class OpenSalesDayUseCase {
  private readonly command: SalesDayCommandPort;

  constructor(command: SalesDayCommandPort) {
    this.command = command;
  }

  async execute(sellerId: string): Promise<SalesDayModel> {
    const id = sellerId.trim();
    if (!id) {
      throw new SalesDaySellerRequiredError();
    }
    return this.command.open(id);
  }
}
