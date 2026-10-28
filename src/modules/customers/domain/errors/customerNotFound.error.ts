export class CustomerNotFoundError extends Error {
  readonly code = 'CUSTOMER_NOT_FOUND';

  constructor() {
    super('CUSTOMER_NOT_FOUND');
    this.name = 'CustomerNotFoundError';
  }
}
