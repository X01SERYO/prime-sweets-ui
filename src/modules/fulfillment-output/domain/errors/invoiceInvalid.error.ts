export class InvoiceInvalidError extends Error {
  readonly code = 'INVOICE_INVALID';

  constructor() {
    super('INVOICE_INVALID');
    this.name = 'InvoiceInvalidError';
  }
}
