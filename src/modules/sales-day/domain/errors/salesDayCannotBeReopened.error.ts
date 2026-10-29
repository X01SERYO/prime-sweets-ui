export class SalesDayCannotBeReopenedError extends Error {
  readonly code = 'SALES_DAY_CANNOT_BE_REOPENED';

  constructor() {
    super('SALES_DAY_CANNOT_BE_REOPENED');
    this.name = 'SalesDayCannotBeReopenedError';
  }
}
