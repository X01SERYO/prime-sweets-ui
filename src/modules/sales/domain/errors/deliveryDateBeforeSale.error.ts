export class DeliveryDateBeforeSaleError extends Error {
  readonly code = 'DELIVERY_DATE_BEFORE_SALE';

  constructor() {
    super('DELIVERY_DATE_BEFORE_SALE');
    this.name = 'DeliveryDateBeforeSaleError';
  }
}
