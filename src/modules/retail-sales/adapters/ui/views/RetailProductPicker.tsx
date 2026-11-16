import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import type { SearchRetailProductsUseCase } from '@/modules/retail-sales/application/use-cases/searchRetailProducts.useCase';
import type { RetailProductOption } from '@/modules/retail-sales/domain/models/retailDay';
import { isProductSearchTerm } from '@/modules/catalog/domain/productSearchTerm';
import { formatCurrency } from '@/shared/domain/money';
import { useLocale } from '@/shared/i18n/useLocale';
import { StatusMessage } from '@/shared/ui/StatusMessage';

export function RetailProductPicker({
  searchProducts,
  items,
  onAdd
}: {
  searchProducts: SearchRetailProductsUseCase;
  items: { productId: string; quantity: number }[];
  onAdd: (productId: string, quantity: number) => Promise<boolean>;
}) {
  const { t } = useLocale();
  const listId = useId();
  const searchRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<RetailProductOption[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const canSearch = isProductSearchTerm(query);

  useEffect(() => {
    const term = query.trim();
    if (!isProductSearchTerm(term)) {
      setOpen(false);
      setResults([]);
      return;
    }
    let cancelled = false;
    const handle = window.setTimeout(() => {
      searchProducts
        .execute(term)
        .then(found => {
          if (!cancelled) {
            setResults(found);
            setActive(0);
            setError(null);
            setOpen(true);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setResults([]);
            setOpen(false);
            setError(t('retailLoadFailed'));
          }
        });
    }, 200);
    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [query, searchProducts, t]);

  async function submitSearch() {
    if (!isProductSearchTerm(query)) {
      setError(t('searchRequired'));
      setOpen(false);
      return;
    }
    setError(null);
    try {
      const found = await searchProducts.execute(query);
      setResults(found);
      setActive(0);
      setOpen(true);
    } catch {
      setResults([]);
      setError(t('retailLoadFailed'));
    }
  }

  async function choose(option: RetailProductOption) {
    if (option.retailPrice === null || option.retailPrice <= 0 || busy) {
      return;
    }
    setBusy(true);
    const ok = await onAdd(option.id, 1);
    setBusy(false);
    if (ok) {
      setOpen(false);
      setQuery('');
      searchRef.current?.focus();
    }
  }

  function onSearchKey(event: KeyboardEvent<HTMLInputElement>) {
    if (!open || results.length === 0) {
      if (event.key === 'Enter') {
        event.preventDefault();
        void submitSearch();
      }
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive(index => (index + 1) % results.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive(index => (index - 1 + results.length) % results.length);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      choose(results[active]);
    } else if (event.key === 'Escape') {
      setOpen(false);
    }
  }

  return (
    <div className="retail-finder">
      <form
        onSubmit={event => {
          event.preventDefault();
          void submitSearch();
        }}
      >
        <label htmlFor="retail-product-query">{t('retailAddProduct')}</label>
        <div className="retail-field">
          <SearchIcon />
          <input
            ref={searchRef}
            id="retail-product-query"
            value={query}
            placeholder={t('productSearchPlaceholder')}
            role="combobox"
            aria-expanded={open}
            aria-controls={listId}
            autoComplete="off"
            onChange={event => setQuery(event.target.value)}
            onKeyDown={onSearchKey}
          />
          <button className="retail-search-go" type="submit" aria-label={t('search')} disabled={!canSearch} />
        </div>
        <p className="retail-hint">{t('retailSearchHint')}</p>
      </form>
      {error ? <StatusMessage tone="error">{error}</StatusMessage> : null}
      {open ? (
        <ul id={listId} className="retail-results" role="listbox">
          {results.length === 0 ? <li>{t('retailNoResults')}</li> : null}
          {results.map((option, index) => {
            const disabled = option.retailPrice === null || option.retailPrice <= 0;
            const inSale = items.find(item => item.productId === option.id);
            return (
              <li key={option.id} role="option" aria-selected={index === active} aria-disabled={disabled}>
                <button type="button" disabled={disabled} onClick={() => choose(option)}>
                  <span className="retail-opt-code">{option.code}</span>
                  <span className="retail-opt-name">{highlight(option.name, query)}</span>
                  {inSale ? <span className="retail-opt-in">{t('retailInSale')} ×{inSale.quantity}</span> : <span />}
                  <span className="retail-opt-price">
                    {option.retailPrice !== null && option.retailPrice > 0 ? formatCurrency(option.retailPrice) : t('retailNoPrice')}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

function highlight(name: string, query: string) {
  const needle = query.trim();
  if (!needle) {
    return name;
  }
  const index = name.toLocaleLowerCase().indexOf(needle.toLocaleLowerCase());
  if (index < 0) {
    return name;
  }
  return (
    <>
      {name.slice(0, index)}
      <mark>{name.slice(index, index + needle.length)}</mark>
      {name.slice(index + needle.length)}
    </>
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

