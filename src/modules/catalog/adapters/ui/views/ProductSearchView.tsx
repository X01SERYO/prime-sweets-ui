import type { FormEvent } from 'react';
import type { SearchProductsUseCase } from '@/modules/catalog/application/use-cases/searchProducts.useCase';
import { formatCurrency } from '@/modules/catalog/domain/value-objects/price';
import { useProductSearch } from '@/modules/catalog/adapters/ui/hooks/useProductSearch';
import { useLocale } from '@/shared/i18n/useLocale';
import '@/modules/catalog/adapters/ui/views/productSearch.css';

interface ProductSearchViewProps {
  searchProducts: SearchProductsUseCase;
}

export function ProductSearchView({ searchProducts }: ProductSearchViewProps) {
  const { t } = useLocale();
  const { query, setQuery, submit, products, loading, error, searched } = useProductSearch(searchProducts);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void submit();
  }

  return (
    <section className="stack">
      <h1>{t('sale')}</h1>
      <p className="m">{t('searchHint')}</p>
      <form className="card" onSubmit={onSubmit}>
        <label htmlFor="product-query">{t('searchProduct')}</label>
        <div className="row">
          <input
            className="product-search-field"
            id="product-query"
            value={query}
            onChange={event => setQuery(event.target.value)}
            autoComplete="off"
          />
          <button className="btn" type="submit" disabled={loading}>
            {loading ? t('searching') : t('search')}
          </button>
        </div>
      </form>
      {error ? <p role="alert">{t(error)}</p> : null}
      {searched && !loading && !error && products.length === 0 ? <p className="m">{t('noResults')}</p> : null}
      <p className="m">{t('linesLater')}</p>
      {products.length > 0 ? (
        <ul className="product-hits">
          {products.map(product => (
            <li key={product.id}>
              <span>{product.name ?? t('noName')}</span>
              <span className="m">
                {product.code}
                {' · '}
                {product.wholesalePrice === null ? t('noPrice') : formatCurrency(product.wholesalePrice)} {t('wholesale')}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
