import type { SaleCommandPort } from '@/modules/sales/application/ports/saleCommand.port';
import { SaleInvalidError } from '@/modules/sales/domain/errors/saleInvalid.error';
import type { SaleModel } from '@/modules/sales/domain/models/sale';

export class UpdateSaleItemQuantityUseCase {
  private readonly command: SaleCommandPort;

  constructor(command: SaleCommandPort) {
    this.command = command;
  }

  async execute(saleId: string, itemId: string, quantity: number): Promise<SaleModel> {
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new SaleInvalidError();
    }
    return this.command.updateQuantity(saleId, itemId, quantity);
  }
}
