import { useCallback, useEffect, useRef, useState } from 'react';
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
  const openedQuery = useRef('');
  const queryRef = useRef(query);
  const requestId = useRef(0);
  const refineTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  queryRef.current = query;

  const canSearch = isProductSearchTerm(query);

  async function submit(next?: string) {
    const term = (next ?? queryRef.current).trim();
    if (next !== undefined) {
      setQuery(next);
    }
    if (!isProductSearchTerm(term)) {
      if (!searched) {
        setProducts([]);
        setError('searchRequired');
      }
      return;
    }
    const id = ++requestId.current;
    openedQuery.current = term;
    setProducts([]);
    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      const found = await searchProducts.execute(term);
      if (id !== requestId.current) {
        return;
      }
      setProducts(found);
    } catch (caught) {
      if (id !== requestId.current) {
        return;
      }
      setProducts([]);
      setError(caught instanceof CatalogInvalidError ? 'catalogInvalid' : 'catalogFailed');
    } finally {
      if (id === requestId.current) {
        setLoading(false);
      }
    }
  }

  function refine(value: string) {
    setQuery(value);
    if (refineTimer.current) {
      clearTimeout(refineTimer.current);
    }
    refineTimer.current = setTimeout(() => {
      void submit(value);
    }, 250);
  }

  useEffect(() => () => {
    if (refineTimer.current) {
      clearTimeout(refineTimer.current);
    }
  }, []);

  const closeResults = useCallback(() => {
    if (refineTimer.current) {
      clearTimeout(refineTimer.current);
    }
    requestId.current += 1;
    setQuery(openedQuery.current);
    setProducts([]);
    setSearched(false);
    setError(null);
  }, []);

  const keepQuery = useCallback(() => {
    setQuery(openedQuery.current);
  }, []);

  const resetQuery = useCallback(() => {
    if (refineTimer.current) {
      clearTimeout(refineTimer.current);
    }
    requestId.current += 1;
    openedQuery.current = '';
    setQuery('');
    setProducts([]);
    setSearched(false);
    setError(null);
  }, []);

  return { query, setQuery, submit, refine, products, loading, error, searched, canSearch, closeResults, keepQuery, resetQuery };
}
