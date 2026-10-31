import type { CustomerQueryPort } from '@/modules/customers/application/ports/customerQuery.port';
import type { SaleQueryPort } from '@/modules/sales/application/ports/saleQuery.port';
import { SaleInvalidError } from '@/modules/sales/domain/errors/saleInvalid.error';
import type { DaySaleModel } from '@/modules/sales/domain/models/daySale';

export class ListSalesByDeliveryDateUseCase {
  private readonly sales: SaleQueryPort;
  private readonly customers: CustomerQueryPort;

  constructor(sales: SaleQueryPort, customers: CustomerQueryPort) {
    this.sales = sales;
    this.customers = customers;
  }

  async execute(deliveryDate: string): Promise<DaySaleModel[]> {
    const date = deliveryDate.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new SaleInvalidError();
    }
    const sales = (await this.sales.listByDeliveryDate(date))
      .slice()
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
    const names = new Map<string, string>();
    const rows: DaySaleModel[] = [];
    for (const sale of sales) {
      if (!names.has(sale.customerId)) {
        const customer = await this.customers.get(sale.customerId);
        names.set(sale.customerId, customer.name);
      }
      rows.push({
        id: sale.id,
        customerId: sale.customerId,
        customerName: names.get(sale.customerId) ?? '',
        status: sale.status,
        quantity: sale.totalQuantity,
        total: sale.totalAmount,
        invoiceNumber: sale.invoiceNumber
      });
    }
    return rows;
  }
}
