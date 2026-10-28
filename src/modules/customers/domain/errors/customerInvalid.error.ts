export class CustomerInvalidError extends Error {
  readonly code = 'CUSTOMER_INVALID';

  constructor() {
    super('CUSTOMER_INVALID');
    this.name = 'CustomerInvalidError';
  }
}
