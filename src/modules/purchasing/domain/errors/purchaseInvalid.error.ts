export class PurchaseInvalidError extends Error {
  readonly code: string;

  constructor(code = 'PURCHASE_FAILED') {
    super(code);
    this.name = 'PurchaseInvalidError';
    this.code = code;
  }
}
