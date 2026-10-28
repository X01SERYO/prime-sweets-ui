import type { SaleCommandPort } from '@/modules/sales/application/ports/saleCommand.port';
import { SaleInvalidError } from '@/modules/sales/domain/errors/saleInvalid.error';
import { SaleMustContainItemsError } from '@/modules/sales/domain/errors/saleMustContainItems.error';
import type { SaleModel } from '@/modules/sales/domain/models/sale';

export class ConfirmSaleUseCase {
  private readonly command: SaleCommandPort;

  constructor(command: SaleCommandPort) {
    this.command = command;
  }

  async execute(saleId: string, itemCount: number): Promise<SaleModel> {
    if (itemCount < 1) {
      throw new SaleMustContainItemsError();
    }
    const sale = await this.command.confirm(saleId.trim());
    if (sale.status !== 'CONFIRMED' || !sale.invoiceNumber) {
      throw new SaleInvalidError();
    }
    return sale;
  }
}
