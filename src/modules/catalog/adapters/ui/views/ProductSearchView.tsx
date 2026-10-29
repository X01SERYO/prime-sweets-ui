import type { FormEvent } from 'react';
import type { SearchProductsUseCase } from '@/modules/catalog/application/use-cases/searchProducts.useCase';
import type { ProductHit } from '@/modules/catalog/domain/models/productHit';
import { formatCurrency } from '@/shared/domain/money';
import { useProductSearch } from '@/modules/catalog/adapters/ui/hooks/useProductSearch';
import { useLocale } from '@/shared/i18n/useLocale';
import '@/modules/catalog/adapters/ui/views/productSearch.css';

interface ProductSearchViewProps {
  searchProducts: SearchProductsUseCase;
  onSelect?: (product: ProductHit) => void;
  selecting?: boolean;
}

export function ProductSearchView({ searchProducts, onSelect, selecting }: ProductSearchViewProps) {
  const { t } = useLocale();
  const { query, setQuery, submit, products, loading, error, searched, clear } = useProductSearch(searchProducts);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void submit();
  }

  return (
    <section className="stack">
      <h2>{t('saleItems')}</h2>
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
      {products.length > 0 ? (
        <ul className="product-hits">
          {products.map(product => (
            <li key={product.id}>
              <span>{product.name ?? t('noName')}</span>
              <span className="m product-hit-meta">
                {product.code}
                {' · '}
                {product.wholesalePrice === null ? t('noPrice') : formatCurrency(product.wholesalePrice)}
              </span>
              {onSelect ? (
                <button
                  className="btn icon-btn icon-edit"
                  type="button"
                  aria-label={t('addItem')}
                  disabled={selecting}
                  onClick={() => {
                    onSelect(product);
                    clear();
                  }}
                >
                  <AddIcon />
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

function AddIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6V5z" />
    </svg>
  );
}
