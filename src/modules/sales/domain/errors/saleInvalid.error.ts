export class SaleInvalidError extends Error {
  readonly code = 'SALE_INVALID';

  constructor() {
    super('SALE_INVALID');
    this.name = 'SaleInvalidError';
  }
}
