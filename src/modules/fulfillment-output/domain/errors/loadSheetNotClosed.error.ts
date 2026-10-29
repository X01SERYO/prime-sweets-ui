export class LoadSheetNotClosedError extends Error {
  readonly code = 'SALES_DAY_NOT_CLOSED';

  constructor() {
    super('SALES_DAY_NOT_CLOSED');
    this.name = 'LoadSheetNotClosedError';
  }
}
