export class SaleAlreadyVoidedError extends Error {
  readonly code = 'SALE_ALREADY_VOIDED';

  constructor() {
    super('SALE_ALREADY_VOIDED');
    this.name = 'SaleAlreadyVoidedError';
  }
}
