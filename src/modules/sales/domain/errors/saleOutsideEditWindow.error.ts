export class SaleOutsideEditWindowError extends Error {
  readonly code = 'SALE_OUTSIDE_EDIT_WINDOW';

  constructor() {
    super('SALE_OUTSIDE_EDIT_WINDOW');
    this.name = 'SaleOutsideEditWindowError';
  }
}
