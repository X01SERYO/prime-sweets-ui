import { useState } from 'react';
import type { SearchProductsUseCase } from '@/modules/catalog/application/use-cases/searchProducts.useCase';
import type { ProductHit } from '@/modules/catalog/domain/models/productHit';
import { CatalogInvalidError } from '@/modules/catalog/domain/errors/catalogInvalid.error';
import { isProductSearchTerm } from '@/modules/catalog/domain/productSearchTerm';
import type { MessageKey } from '@/shared/i18n/messages';

export function useProductSearch(searchProducts: SearchProductsUseCase) {
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState<ProductHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<MessageKey | null>(null);
  const [searched, setSearched] = useState(false);

  const canSearch = isProductSearchTerm(query);

  async function submit() {
    if (!canSearch) {
      setProducts([]);
      setSearched(false);
      setError('searchRequired');
      return;
    }
    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      setProducts(await searchProducts.execute(query));
    } catch (caught) {
      setProducts([]);
      setError(caught instanceof CatalogInvalidError ? 'catalogInvalid' : 'catalogFailed');
    } finally {
      setLoading(false);
    }
  }

  function clear() {
    setProducts([]);
    setSearched(false);
    setError(null);
  }

  return { query, setQuery, submit, products, loading, error, searched, canSearch, clear };
}
