import type { SaleCommandPort } from '@/modules/sales/application/ports/saleCommand.port';
import { SaleInvalidError } from '@/modules/sales/domain/errors/saleInvalid.error';
import type { SaleModel } from '@/modules/sales/domain/models/sale';

export class VoidSaleUseCase {
  private readonly command: SaleCommandPort;

  constructor(command: SaleCommandPort) {
    this.command = command;
  }

  async execute(saleId: string): Promise<SaleModel> {
    const sale = await this.command.void(saleId.trim());
    if (sale.status !== 'VOIDED' || !sale.invoiceNumber) {
      throw new SaleInvalidError();
    }
    return sale;
  }
}
