import { useEffect, useRef, type FormEvent, type ReactNode } from 'react';
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
  outcome?: { id: number; added: boolean } | null;
}

export function ProductSearchView({ searchProducts, onSelect, selecting, outcome }: ProductSearchViewProps) {
  const { t } = useLocale();
  const { query, setQuery, submit, products, loading, error, searched, canSearch, closeResults, keepQuery, resetQuery } = useProductSearch(searchProducts);
  const seenOutcome = useRef<number | null>(null);

  useEffect(() => {
    if (!outcome || seenOutcome.current === outcome.id) {
      return;
    }
    seenOutcome.current = outcome.id;
    if (outcome.added) {
      resetQuery();
      return;
    }
    keepQuery();
  }, [keepQuery, outcome, resetQuery]);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void submit();
  }

  return (
    <section className="stack">
      <form className="card" onSubmit={onSubmit}>
        <div className="search-label">
          <label htmlFor="product-query">{t('searchProduct')}</label>
          <button type="button" className="info-tip" aria-label={t('searchHint')}>
            <InfoIcon />
            <span className="info-tip-text" role="tooltip">{t('searchHint')}</span>
          </button>
        </div>
        <div className="search-row">
          <input
            className="search-field"
            id="product-query"
            value={query}
            onChange={event => setQuery(event.target.value)}
            autoComplete="off"
          />
          <button
            className="btn search-submit"
            type="submit"
            aria-label={loading ? t('searching') : t('search')}
            disabled={!canSearch || loading}
          >
            <SearchIcon />
          </button>
        </div>
      </form>
      {searched ? (
        <SearchResults
          title={t('searchResults')}
          closeLabel={t('closeSearch')}
          onClose={closeResults}
        >
          {error ? <p role="alert">{t(error)}</p> : null}
          {!loading && !error && products.length === 0 ? <p className="m">{t('noResults')}</p> : null}
          {products.length > 0 ? (
            <ul className="product-hits">
              {products.map(product => (
                <li key={product.id}>
                  <span className="product-hit-code">{product.code}</span>
                  <span>{product.name ?? t('noName')}</span>
                  <span className="product-hit-price">
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
                        closeResults();
                      }}
                    >
                      <AddIcon />
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : null}
        </SearchResults>
      ) : null}
    </section>
  );
}

function SearchResults({
  title,
  closeLabel,
  onClose,
  children
}: {
  title: string;
  closeLabel: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || dialog.open) {
      return;
    }
    dialog.showModal();
    return () => {
      if (dialog.open) {
        dialog.close();
      }
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className="modal product-search-modal"
      onCancel={event => {
        event.preventDefault();
        onClose();
      }}
    >
      <div className="modal-toolbar">
        <h2>{title}</h2>
        <button className="modal-x" type="button" aria-label={closeLabel} onClick={onClose}>
          <CloseIcon />
        </button>
      </div>
      <div className="modal-scroll">{children}</div>
    </dialog>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M18.3 5.71 12 12.01l6.3 6.3-1.42 1.41L10.59 13.4l-6.3 6.3-1.41-1.42 6.3-6.29-6.3-6.3 1.42-1.41 6.29 6.29 6.3-6.3z" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="10.5" cy="10.5" r="6.25" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M15.2 15.2 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
      <circle cx="8" cy="8" r="6.25" fill="none" stroke="currentColor" strokeWidth="1.25" />
      <path d="M8 7.25v4" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
      <circle cx="8" cy="5" r="0.75" fill="currentColor" />
    </svg>
  );
}

function AddIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6V5z" />
    </svg>
  );
}
