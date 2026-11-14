export class RetailInvalidError extends Error {
  readonly code: string;

  constructor(code = 'RETAIL_INVALID') {
    super(code);
    this.name = 'RetailInvalidError';
    this.code = code;
  }
}
