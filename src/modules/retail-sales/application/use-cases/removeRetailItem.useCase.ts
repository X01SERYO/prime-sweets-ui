import type { RetailDayPort } from '@/modules/retail-sales/application/ports/retailDay.port';
import { RetailInvalidError } from '@/modules/retail-sales/domain/errors/retailInvalid.error';
import type { RetailDayModel } from '@/modules/retail-sales/domain/models/retailDay';

export class RemoveRetailItemUseCase {
  private readonly retailDays: RetailDayPort;

  constructor(retailDays: RetailDayPort) {
    this.retailDays = retailDays;
  }

  execute(productId: string): Promise<RetailDayModel> {
    if (!productId.trim()) {
      return Promise.reject(new RetailInvalidError());
    }
    return this.retailDays.removeItem(productId);
  }
}
