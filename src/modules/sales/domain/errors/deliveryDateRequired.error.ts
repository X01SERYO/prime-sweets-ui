export class DeliveryDateRequiredError extends Error {
  readonly code = 'DELIVERY_DATE_REQUIRED';

  constructor() {
    super('DELIVERY_DATE_REQUIRED');
    this.name = 'DeliveryDateRequiredError';
  }
}
