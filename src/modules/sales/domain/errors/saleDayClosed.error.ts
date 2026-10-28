export class SaleDayClosedError extends Error {
  readonly code = 'SALES_DAY_NOT_OPEN';

  constructor() {
    super('SALES_DAY_NOT_OPEN');
    this.name = 'SaleDayClosedError';
  }
}
