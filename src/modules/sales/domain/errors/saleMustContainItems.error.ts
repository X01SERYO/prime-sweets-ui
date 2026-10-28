export class SaleMustContainItemsError extends Error {
  readonly code = 'SALE_MUST_CONTAIN_ITEMS';

  constructor() {
    super('SALE_MUST_CONTAIN_ITEMS');
    this.name = 'SaleMustContainItemsError';
  }
}
