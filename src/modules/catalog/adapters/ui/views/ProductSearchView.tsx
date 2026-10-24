import type { FormEvent } from 'react';
import type { SearchProductsUseCase } from '@/modules/catalog/application/use-cases/searchProducts.useCase';
import { formatCurrency } from '@/modules/catalog/domain/value-objects/price';
import { useProductSearch } from '@/modules/catalog/adapters/ui/hooks/useProductSearch';
import '@/modules/catalog/adapters/ui/views/productSearch.css';

interface ProductSearchViewProps {
  searchProducts: SearchProductsUseCase;
}

export function ProductSearchView({ searchProducts }: ProductSearchViewProps) {
  const { query, setQuery, submit, products, loading, error, searched } = useProductSearch(searchProducts);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void submit();
  }

  return (
    <section className="product-search">
      <h1>Venta</h1>
      <p>Busca por nombre, marca o código. El precio mayorista solo se muestra.</p>
      <form onSubmit={onSubmit}>
        <label htmlFor="product-query">Producto</label>
        <input
          id="product-query"
          value={query}
          onChange={event => setQuery(event.target.value)}
          autoComplete="off"
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Buscando…' : 'Buscar'}
        </button>
      </form>
      {error ? <p role="alert">{error}</p> : null}
      {searched && !loading && !error && products.length === 0 ? <p>Sin resultados.</p> : null}
      {products.length > 0 ? (
        <ul className="product-hits">
          {products.map(product => (
            <li key={product.id}>
              <span>{product.name ?? 'Sin nombre'}</span>
              <span>{product.code}</span>
              <span className="product-price">
                {product.wholesalePrice === null ? 'Sin precio' : formatCurrency(product.wholesalePrice)}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
