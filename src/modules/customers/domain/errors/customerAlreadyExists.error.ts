export class CustomerAlreadyExistsError extends Error {
  readonly code = 'CUSTOMER_ALREADY_EXISTS';

  constructor() {
    super('CUSTOMER_ALREADY_EXISTS');
    this.name = 'CustomerAlreadyExistsError';
  }
}
