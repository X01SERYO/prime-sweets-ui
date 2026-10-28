import type { SaleCommandPort } from '@/modules/sales/application/ports/saleCommand.port';
import { SaleInvalidError } from '@/modules/sales/domain/errors/saleInvalid.error';
import type { SaleModel } from '@/modules/sales/domain/models/sale';

export class UpdateSaleItemNameUseCase {
  private readonly command: SaleCommandPort;

  constructor(command: SaleCommandPort) {
    this.command = command;
  }

  async execute(saleId: string, productId: string, itemName: string): Promise<SaleModel> {
    const name = itemName.trim();
    if (!name) {
      throw new SaleInvalidError();
    }
    return this.command.updateName(saleId, productId, name);
  }
}
