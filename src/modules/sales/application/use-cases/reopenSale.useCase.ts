import type { SaleCommandPort } from '@/modules/sales/application/ports/saleCommand.port';
import { SaleInvalidError } from '@/modules/sales/domain/errors/saleInvalid.error';
import type { SaleModel } from '@/modules/sales/domain/models/sale';

export class ReopenSaleUseCase {
  private readonly command: SaleCommandPort;

  constructor(command: SaleCommandPort) {
    this.command = command;
  }

  async execute(saleId: string): Promise<SaleModel> {
    const sale = await this.command.reopen(saleId.trim());
    if (sale.status !== 'DRAFT') {
      throw new SaleInvalidError();
    }
    return sale;
  }
}
