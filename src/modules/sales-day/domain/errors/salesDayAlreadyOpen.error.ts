export class SalesDayAlreadyOpenError extends Error {
  readonly code = 'SALES_DAY_ALREADY_OPEN';

  constructor() {
    super('SALES_DAY_ALREADY_OPEN');
    this.name = 'SalesDayAlreadyOpenError';
  }
}
