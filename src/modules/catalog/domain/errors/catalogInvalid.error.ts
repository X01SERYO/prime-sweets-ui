export class CatalogInvalidError extends Error {
  readonly code = 'CATALOG_INVALID';

  constructor() {
    super('CATALOG_INVALID');
    this.name = 'CatalogInvalidError';
  }
}
