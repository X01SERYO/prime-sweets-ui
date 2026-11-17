import type { SaleCommandPort } from '@/modules/sales/application/ports/saleCommand.port';
import { SaleInvalidError } from '@/modules/sales/domain/errors/saleInvalid.error';
import type { SaleModel } from '@/modules/sales/domain/models/sale';

export class AssignSaleCustomerUseCase {
  private readonly command: SaleCommandPort;

  constructor(command: SaleCommandPort) {
    this.command = command;
  }

  async execute(saleId: string, customerId: string): Promise<SaleModel> {
    const id = saleId.trim();
    const customer = customerId.trim();
    if (!id || !customer) {
      throw new SaleInvalidError();
    }
    return this.command.assignCustomer(id, customer);
  }
}
