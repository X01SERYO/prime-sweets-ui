import { Plus, Search, X } from 'lucide-react';
import { useEffect, useRef, type FormEvent, type ReactNode } from 'react';
import type { SearchProductsUseCase } from '@/modules/catalog/application/use-cases/searchProducts.useCase';
import type { ProductHit } from '@/modules/catalog/domain/models/productHit';
import { formatCurrency } from '@/shared/domain/money';
import { useProductSearch } from '@/modules/catalog/adapters/ui/hooks/useProductSearch';
import { useLocale } from '@/shared/i18n/useLocale';
import { StatusMessage } from '@/shared/ui/StatusMessage';
import '@/modules/catalog/adapters/ui/views/productSearch.css';

interface ProductSearchViewProps {
  searchProducts: SearchProductsUseCase;
  onSelect?: (product: ProductHit) => void;
  selecting?: boolean;
  outcome?: { id: number; added: boolean } | null;
  step?: number | null;
}

export function ProductSearchView({ searchProducts, onSelect, selecting, outcome, step = 3 }: ProductSearchViewProps) {
  const { t } = useLocale();
  const { query, setQuery, submit, refine, products, loading, error, searched, canSearch, closeResults, keepQuery, resetQuery } = useProductSearch(searchProducts);
  const seenOutcome = useRef<number | null>(null);
  const queryRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!outcome || seenOutcome.current === outcome.id) {
      return;
    }
    seenOutcome.current = outcome.id;
    if (outcome.added) {
      resetQuery();
      queryRef.current?.focus();
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
        <label className="step-label" htmlFor="product-query">
          {step != null ? <span className="step-num">{step}</span> : null}
          {t('searchProduct')}
        </label>
        <div className="search-row">
          <input
            ref={queryRef}
            className="search-field"
            id="product-query"
            value={query}
            placeholder={t('productSearchPlaceholder')}
            onChange={event => setQuery(event.target.value)}
            autoComplete="off"
          />
          <button
            className="btn search-submit"
            type="submit"
            aria-label={loading ? t('searching') : t('search')}
            disabled={!canSearch || loading}
          >
            <Search aria-hidden="true" strokeWidth={1.8} />
          </button>
        </div>
      </form>
      {searched ? (
        <SearchResults
          title={t('searchResults')}
          closeLabel={t('closeSearch')}
          onClose={closeResults}
          search={
            <form className="modal-search search-row" onSubmit={event => { event.preventDefault(); void submit(query); }}>
              <input
                className="search-field"
                id="product-query-modal"
                value={query}
                placeholder={t('productSearchPlaceholder')}
                onChange={event => refine(event.target.value)}
                autoComplete="off"
                autoFocus
              />
              <button
                className="btn search-submit"
                type="submit"
                aria-label={loading ? t('searching') : t('search')}
                disabled={!canSearch || loading}
              >
                <Search aria-hidden="true" strokeWidth={1.8} />
              </button>
            </form>
          }
        >
          {error ? <StatusMessage tone="error">{t(error)}</StatusMessage> : null}
          {!loading && !error && products.length === 0 ? (
            <StatusMessage tone="info">{t('noResults')}</StatusMessage>
          ) : null}
          {products.length > 0 ? (
            <ul className="product-hits">
              {products.map(product => (
                <li key={product.id}>
                  <button
                    className="product-hit"
                    type="button"
                    aria-label={t('addItem')}
                    disabled={!onSelect || selecting}
                    onClick={() => {
                      if (!onSelect) {
                        return;
                      }
                      onSelect(product);
                      closeResults();
                    }}
                  >
                    <span className="product-hit-code">{highlightMatch(product.code, query)}</span>
                    <span>{product.name ? highlightMatch(product.name, query) : t('noName')}</span>
                    <span className="product-hit-price">
                      {product.wholesalePrice === null ? t('noPrice') : formatCurrency(product.wholesalePrice)}
                    </span>
                    <span className="product-hit-plus" aria-hidden="true">
                      <Plus strokeWidth={1.8} />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </SearchResults>
      ) : null}
    </section>
  );
}

function highlightMatch(text: string, query: string): ReactNode {
  const needle = query.trim();
  if (!needle) {
    return text;
  }
  const index = text.toLocaleLowerCase().indexOf(needle.toLocaleLowerCase());
  if (index < 0) {
    return text;
  }
  return (
    <>
      {text.slice(0, index)}
      <mark>{text.slice(index, index + needle.length)}</mark>
      {text.slice(index + needle.length)}
    </>
  );
}

function SearchResults({
  title,
  closeLabel,
  onClose,
  search,
  children
}: {
  title: string;
  closeLabel: string;
  onClose: () => void;
  search: ReactNode;
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
          <X aria-hidden="true" strokeWidth={1.8} />
        </button>
      </div>
      {search}
      <div className="modal-scroll">{children}</div>
    </dialog>
  );
}
