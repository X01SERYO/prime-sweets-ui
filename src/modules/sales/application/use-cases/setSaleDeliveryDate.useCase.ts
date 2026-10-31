import type { SaleCommandPort } from '@/modules/sales/application/ports/saleCommand.port';
import { SaleInvalidError } from '@/modules/sales/domain/errors/saleInvalid.error';
import type { SaleModel } from '@/modules/sales/domain/models/sale';

export class SetSaleDeliveryDateUseCase {
  private readonly command: SaleCommandPort;

  constructor(command: SaleCommandPort) {
    this.command = command;
  }

  async execute(saleId: string, deliveryDate: string): Promise<SaleModel> {
    const id = saleId.trim();
    const date = deliveryDate.trim();
    if (!id || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new SaleInvalidError();
    }
    return this.command.setDeliveryDate(id, date);
  }
}
