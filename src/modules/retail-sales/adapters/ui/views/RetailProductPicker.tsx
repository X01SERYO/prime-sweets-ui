import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import type { SearchRetailProductsUseCase } from '@/modules/retail-sales/application/use-cases/searchRetailProducts.useCase';
import type { RetailProductOption } from '@/modules/retail-sales/domain/models/retailDay';
import { parseRetailQuantity } from '@/modules/retail-sales/domain/quantity';
import { isProductSearchTerm } from '@/modules/catalog/domain/productSearchTerm';
import { formatCurrency } from '@/shared/domain/money';
import { useLocale } from '@/shared/i18n/useLocale';
import { StatusMessage } from '@/shared/ui/StatusMessage';

export function RetailProductPicker({
  searchProducts,
  onAdd
}: {
  searchProducts: SearchRetailProductsUseCase;
  onAdd: (productId: string, quantity: number) => Promise<boolean>;
}) {
  const { t } = useLocale();
  const listId = useId();
  const searchRef = useRef<HTMLInputElement>(null);
  const quantityRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<RetailProductOption[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [selected, setSelected] = useState<RetailProductOption | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const parsed = parseRetailQuantity(quantity);
  const canSearch = isProductSearchTerm(query);

  useEffect(() => {
    if (selected) {
      quantityRef.current?.focus();
      quantityRef.current?.select();
    }
  }, [selected]);

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

  function choose(option: RetailProductOption) {
    if (option.retailPrice === null || option.retailPrice <= 0) {
      return;
    }
    setSelected(option);
    setQuantity('1');
    setOpen(false);
    setQuery('');
  }

  async function add() {
    if (!selected || parsed === null || busy) {
      return;
    }
    setBusy(true);
    const ok = await onAdd(selected.id, parsed);
    setBusy(false);
    if (ok) {
      setSelected(null);
      setQuantity('1');
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
    <div className="retail-picker">
      <form
        className="card"
        onSubmit={event => {
          event.preventDefault();
          void submitSearch();
        }}
      >
        <label htmlFor="retail-product-query">{t('searchProduct')}</label>
        <div className="search-row">
          <input
            ref={searchRef}
            id="retail-product-query"
            className="search-field"
            value={query}
            placeholder={t('productSearchPlaceholder')}
            role="combobox"
            aria-expanded={open}
            aria-controls={listId}
            autoComplete="off"
            onChange={event => setQuery(event.target.value)}
            onKeyDown={onSearchKey}
          />
          <button
            className="btn search-submit"
            type="submit"
            aria-label={t('search')}
            disabled={!canSearch}
          >
            <SearchIcon />
          </button>
        </div>
      </form>
      {error ? <StatusMessage tone="error">{error}</StatusMessage> : null}
      {open ? (
        <ul id={listId} className="retail-results" role="listbox">
          {results.length === 0 ? <li>{t('retailNoResults')}</li> : null}
          {results.map((option, index) => {
            const disabled = option.retailPrice === null || option.retailPrice <= 0;
            return (
              <li key={option.id} role="option" aria-selected={index === active} aria-disabled={disabled}>
                <button type="button" disabled={disabled} onClick={() => choose(option)}>
                  {option.code} · {option.brandName} · {option.name}
                  {option.retailPrice !== null && option.retailPrice > 0 ? ` · ${formatCurrency(option.retailPrice)}` : ''}
                  {disabled ? ` · ${t('retailNoPrice')}` : ''}
                  {!disabled && !option.hasCost ? ' ⚠' : ''}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
      {selected ? (
        <div className="retail-selected">
          <p>
            {t('retailSelected')}: {selected.code} · {selected.brandName} · {selected.name}
            {selected.retailPrice !== null ? ` · ${formatCurrency(selected.retailPrice)}` : ''}
            {!selected.hasCost ? <span title={t('retailNoCost')}> ⚠</span> : null}
          </p>
          <label>
            {t('retailQuantity')}
            <span className="qty">
              <button
                className="btn btn-secondary"
                type="button"
                aria-label={t('decreaseQuantity')}
                disabled={parsed === null || parsed <= 1}
                onClick={() => setQuantity(String((parsed ?? 1) - 1))}
              >
                −
              </button>
              <input
                ref={quantityRef}
                inputMode="numeric"
                value={quantity}
                aria-label={t('retailQuantity')}
                onChange={event => setQuantity(event.target.value)}
                onKeyDown={event => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    void add();
                  }
                }}
              />
              <button
                className="btn btn-secondary"
                type="button"
                aria-label={t('increaseQuantity')}
                onClick={() => setQuantity(String((parsed ?? 0) + 1))}
              >
                +
              </button>
            </span>
          </label>
          <button type="button" className="btn primary" disabled={parsed === null || busy} onClick={() => void add()}>
            {t('retailAdd')}
          </button>
        </div>
      ) : null}
    </div>
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

