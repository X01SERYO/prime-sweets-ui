import type { SaleQueryPort } from '@/modules/sales/application/ports/saleQuery.port';
import { SaleInvalidError } from '@/modules/sales/domain/errors/saleInvalid.error';
import type { SaleModel } from '@/modules/sales/domain/models/sale';

export class GetSaleUseCase {
  private readonly query: SaleQueryPort;

  constructor(query: SaleQueryPort) {
    this.query = query;
  }

  async execute(saleId: string): Promise<SaleModel> {
    const id = saleId.trim();
    if (!id) {
      throw new SaleInvalidError();
    }
    return this.query.get(id);
  }
}
