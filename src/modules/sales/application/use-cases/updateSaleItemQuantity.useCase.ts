import type { SaleCommandPort } from '@/modules/sales/application/ports/saleCommand.port';
import { SaleInvalidError } from '@/modules/sales/domain/errors/saleInvalid.error';
import type { SaleModel } from '@/modules/sales/domain/models/sale';
import { isSellableQuantity } from '@/modules/sales/domain/quantity';

export class UpdateSaleItemQuantityUseCase {
  private readonly command: SaleCommandPort;

  constructor(command: SaleCommandPort) {
    this.command = command;
  }

  async execute(saleId: string, itemId: string, quantity: number): Promise<SaleModel> {
    if (!isSellableQuantity(quantity)) {
      throw new SaleInvalidError();
    }
    return this.command.updateQuantity(saleId, itemId, quantity);
  }
}
