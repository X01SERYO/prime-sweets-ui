import type { RetailDayPort } from '@/modules/retail-sales/application/ports/retailDay.port';
import type { RetailDayPage, RetailDayStatus } from '@/modules/retail-sales/domain/models/retailDay';

export class ListRetailDaysUseCase {
  private readonly retailDays: RetailDayPort;

  constructor(retailDays: RetailDayPort) {
    this.retailDays = retailDays;
  }

  execute(status: RetailDayStatus, page: number, pageSize: number): Promise<RetailDayPage> {
    return this.retailDays.list(status, page, pageSize);
  }
}
