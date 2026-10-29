export class SaleCannotBeModifiedError extends Error {
  readonly code = 'SALE_CANNOT_BE_MODIFIED';

  constructor() {
    super('SALE_CANNOT_BE_MODIFIED');
    this.name = 'SaleCannotBeModifiedError';
  }
}
