import type { SaleCommandPort } from '@/modules/sales/application/ports/saleCommand.port';
import { SaleInvalidError } from '@/modules/sales/domain/errors/saleInvalid.error';
import type { SaleModel } from '@/modules/sales/domain/models/sale';

export class CreateDraftSaleUseCase {
  private readonly command: SaleCommandPort;

  constructor(command: SaleCommandPort) {
    this.command = command;
  }

  async execute(customerId: string, deliveryDate: string): Promise<SaleModel> {
    const customer = customerId.trim();
    const date = deliveryDate.trim();
    if (!customer || !date) {
      throw new SaleInvalidError();
    }
    return this.command.create(customer, date);
  }
}
