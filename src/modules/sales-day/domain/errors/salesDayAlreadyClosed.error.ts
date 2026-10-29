export class SalesDayAlreadyClosedError extends Error {
  readonly code = 'SALES_DAY_ALREADY_CLOSED';

  constructor() {
    super('SALES_DAY_ALREADY_CLOSED');
    this.name = 'SalesDayAlreadyClosedError';
  }
}
