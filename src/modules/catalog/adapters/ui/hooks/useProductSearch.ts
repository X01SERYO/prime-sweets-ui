import { useState } from 'react';
import type { SearchProductsUseCase } from '@/modules/catalog/application/use-cases/searchProducts.useCase';
import type { ProductHit } from '@/modules/catalog/domain/models/productHit';

export function useProductSearch(searchProducts: SearchProductsUseCase) {
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState<ProductHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  async function submit() {
    if (!query.trim()) {
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
      setError(caught instanceof Error ? caught.message : 'No se pudo buscar el catálogo');
    } finally {
      setLoading(false);
    }
  }

  return { query, setQuery, submit, products, loading, error, searched };
}
