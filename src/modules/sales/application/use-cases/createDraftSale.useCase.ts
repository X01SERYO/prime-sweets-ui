import type { SaleCommandPort } from '@/modules/sales/application/ports/saleCommand.port';
import { SaleInvalidError } from '@/modules/sales/domain/errors/saleInvalid.error';
import type { SaleModel } from '@/modules/sales/domain/models/sale';

export class CreateDraftSaleUseCase {
  private readonly command: SaleCommandPort;

  constructor(command: SaleCommandPort) {
    this.command = command;
  }

  async execute(salesDayId: string, customerId: string): Promise<SaleModel> {
    const dayId = salesDayId.trim();
    const customer = customerId.trim();
    if (!dayId || !customer) {
      throw new SaleInvalidError();
    }
    return this.command.create(dayId, customer);
  }
}
