import type { RetailDayPort } from '@/modules/retail-sales/application/ports/retailDay.port';
import { RetailInvalidError } from '@/modules/retail-sales/domain/errors/retailInvalid.error';

export class ReviewRetailDaysUseCase {
  private readonly retailDays: RetailDayPort;

  constructor(retailDays: RetailDayPort) {
    this.retailDays = retailDays;
  }

  execute(dates: string[]): Promise<void> {
    if (dates.length === 0) {
      return Promise.reject(new RetailInvalidError());
    }
    return this.retailDays.review(dates);
  }
}
