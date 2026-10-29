import type { SaleCommandPort } from '@/modules/sales/application/ports/saleCommand.port';
import type { SaleModel } from '@/modules/sales/domain/models/sale';

export class RemoveSaleItemUseCase {
  private readonly command: SaleCommandPort;

  constructor(command: SaleCommandPort) {
    this.command = command;
  }

  async execute(saleId: string, itemId: string): Promise<SaleModel> {
    return this.command.removeItem(saleId, itemId);
  }
}
