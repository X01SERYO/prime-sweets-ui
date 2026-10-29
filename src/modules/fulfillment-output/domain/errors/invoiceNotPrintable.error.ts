export class InvoiceNotPrintableError extends Error {
  readonly code = 'SALE_NOT_INVOICEABLE';

  constructor() {
    super('SALE_NOT_INVOICEABLE');
    this.name = 'InvoiceNotPrintableError';
  }
}
