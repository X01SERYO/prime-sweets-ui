import type { RetailDayPort } from '@/modules/retail-sales/application/ports/retailDay.port';
import { RetailInvalidError } from '@/modules/retail-sales/domain/errors/retailInvalid.error';
import type { RetailDayModel } from '@/modules/retail-sales/domain/models/retailDay';
import { isRetailQuantity } from '@/modules/retail-sales/domain/quantity';

export class AddRetailItemUseCase {
  private readonly retailDays: RetailDayPort;

  constructor(retailDays: RetailDayPort) {
    this.retailDays = retailDays;
  }

  execute(productId: string, quantity: number): Promise<RetailDayModel> {
    if (!productId.trim() || !isRetailQuantity(quantity)) {
      return Promise.reject(new RetailInvalidError());
    }
    return this.retailDays.addItem(productId, quantity);
  }
}
