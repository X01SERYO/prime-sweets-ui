export const MIN_PRODUCT_SEARCH_LENGTH = 3;

export function isProductSearchTerm(query: string): boolean {
  return query.trim().length >= MIN_PRODUCT_SEARCH_LENGTH;
}
