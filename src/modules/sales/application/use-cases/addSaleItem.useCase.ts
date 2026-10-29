import type { SaleCommandPort } from '@/modules/sales/application/ports/saleCommand.port';
import { SaleInvalidError } from '@/modules/sales/domain/errors/saleInvalid.error';
import type { SaleModel } from '@/modules/sales/domain/models/sale';

export class AddSaleItemUseCase {
  private readonly command: SaleCommandPort;

  constructor(command: SaleCommandPort) {
    this.command = command;
  }

  async execute(saleId: string, productId: string, quantity: number, itemName: string): Promise<SaleModel> {
    if (!Number.isInteger(quantity) || quantity <= 0 || !itemName.trim()) {
      throw new SaleInvalidError();
    }
    return this.command.addItem(saleId, productId, quantity, itemName.trim());
  }
}
