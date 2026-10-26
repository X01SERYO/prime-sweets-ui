export class SalesDaySellerRequiredError extends Error {
  readonly code = 'SALES_DAY_SELLER_REQUIRED';

  constructor() {
    super('SALES_DAY_SELLER_REQUIRED');
    this.name = 'SalesDaySellerRequiredError';
  }
}
