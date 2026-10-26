export class SalesDayInvalidError extends Error {
  readonly code = 'SALES_DAY_INVALID';

  constructor() {
    super('SALES_DAY_INVALID');
    this.name = 'SalesDayInvalidError';
  }
}
