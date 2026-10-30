import type { SaleCommandPort } from '@/modules/sales/application/ports/saleCommand.port';
import { SaleInvalidError } from '@/modules/sales/domain/errors/saleInvalid.error';
import type { SaleModel } from '@/modules/sales/domain/models/sale';
import { isSellableQuantity } from '@/modules/sales/domain/quantity';

export class AddSaleItemUseCase {
  private readonly command: SaleCommandPort;

  constructor(command: SaleCommandPort) {
    this.command = command;
  }

  async execute(saleId: string, productId: string, quantity: number, itemName: string): Promise<SaleModel> {
    if (!isSellableQuantity(quantity) || !itemName.trim()) {
      throw new SaleInvalidError();
    }
    return this.command.addItem(saleId, productId, quantity, itemName.trim());
  }
}
