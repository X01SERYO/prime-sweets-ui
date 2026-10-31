import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Link } from 'react-router';
import { useCustomerSearch } from '@/modules/customers/adapters/ui/hooks/useCustomerSearch';
import type { SearchCustomersUseCase } from '@/modules/customers/application/use-cases/searchCustomers.useCase';
import { useLocale } from '@/shared/i18n/useLocale';

interface SaleCustomerChoiceProps {
  searchCustomers: SearchCustomersUseCase;
  onSelect: (customerId: string) => void;
}

export function SaleCustomerChoice({ searchCustomers, onSelect }: SaleCustomerChoiceProps) {
  const { t } = useLocale();
  const search = useCustomerSearch(searchCustomers);
  const [mode, setMode] = useState<'search' | null>(null);

  function onSearch(event: FormEvent) {
    event.preventDefault();
    void search.submit();
  }

  return (
    <section className="stack customer-choice">
      <div className="row customer-choice-actions">
        <button className="btn" type="button" onClick={() => setMode('search')}>
          {t('findCustomer')}
        </button>
        <Link className="btn btn-secondary" to="/customers">
          {t('customerCreate')}
        </Link>
      </div>
      {mode === 'search' ? (
        <form className="card" onSubmit={onSearch}>
          <div className="search-label">
            <label htmlFor="customer-query">{t('findCustomer')}</label>
            <button type="button" className="info-tip" aria-label={t('customerSearchHint')}>
              <InfoIcon />
              <span className="info-tip-text" role="tooltip">{t('customerSearchHint')}</span>
            </button>
          </div>
          <div className="search-row">
            <input
              className="search-field"
              id="customer-query"
              value={search.query}
              onChange={event => search.setQuery(event.target.value)}
              autoComplete="off"
            />
            <button
              className="btn search-submit"
              type="submit"
              aria-label={search.loading ? t('searching') : t('search')}
              disabled={!search.query.trim() || search.loading}
            >
              <SearchIcon />
            </button>
          </div>
        </form>
      ) : null}
      {search.error && !search.searched ? <p role="alert">{t(search.error)}</p> : null}
      {search.searched ? (
        <CustomerResults title={t('searchResults')} closeLabel={t('closeSearch')} onClose={search.closeResults}>
          {search.error ? <p role="alert">{t(search.error)}</p> : null}
          {!search.loading && !search.error && search.customers.length === 0 ? (
            <p className="m">
              {t('customerNoResults')} <Link to="/customers">{t('customerCreate')}</Link>
            </p>
          ) : null}
          {search.customers.length > 0 ? (
            <ul className="list">
              {search.customers.map(customer => (
                <li key={customer.id} className="card customer-hit">
                  <span className="customer-hit-text">
                    <b>{customer.name}</b>
                    <span className="m">
                      {customer.documentType} {customer.documentNumber}
                    </span>
                  </span>
                  <button
                    className="btn icon-btn icon-edit"
                    type="button"
                    aria-label={t('chooseCustomer')}
                    onClick={() => {
                      onSelect(customer.id);
                      search.closeResults();
                    }}
                  >
                    <AddIcon />
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </CustomerResults>
      ) : null}
    </section>
  );
}

function CustomerResults({
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
      className="modal customer-search-modal"
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

function AddIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6V5z" />
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
