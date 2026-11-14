import type { RetailDayPort } from '@/modules/retail-sales/application/ports/retailDay.port';
import type { RetailDayModel } from '@/modules/retail-sales/domain/models/retailDay';

export class GetTodayRetailDayUseCase {
  private readonly retailDays: RetailDayPort;

  constructor(retailDays: RetailDayPort) {
    this.retailDays = retailDays;
  }

  execute(): Promise<RetailDayModel> {
    return this.retailDays.getToday();
  }
}
