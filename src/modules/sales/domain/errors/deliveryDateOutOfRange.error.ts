export class DeliveryDateOutOfRangeError extends Error {
  readonly code = 'DELIVERY_DATE_OUT_OF_RANGE';

  constructor() {
    super('DELIVERY_DATE_OUT_OF_RANGE');
    this.name = 'DeliveryDateOutOfRangeError';
  }
}
