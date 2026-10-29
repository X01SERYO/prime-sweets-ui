export class LoadSheetInvalidError extends Error {
  readonly code = 'LOAD_SHEET_INVALID';

  constructor() {
    super('LOAD_SHEET_INVALID');
    this.name = 'LoadSheetInvalidError';
  }
}
