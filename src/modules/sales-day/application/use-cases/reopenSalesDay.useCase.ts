import type { SalesDayCommandPort } from '@/modules/sales-day/application/ports/salesDayCommand.port';
import { SalesDayInvalidError } from '@/modules/sales-day/domain/errors/salesDayInvalid.error';
import type { SalesDayModel } from '@/modules/sales-day/domain/models/salesDay';

export class ReopenSalesDayUseCase {
  private readonly command: SalesDayCommandPort;

  constructor(command: SalesDayCommandPort) {
    this.command = command;
  }

  async execute(salesDayId: string): Promise<SalesDayModel> {
    const id = salesDayId.trim();
    if (!id) {
      throw new SalesDayInvalidError();
    }
    return this.command.reopen(id);
  }
}
