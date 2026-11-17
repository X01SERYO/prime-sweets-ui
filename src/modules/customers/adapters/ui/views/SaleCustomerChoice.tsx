import { Search, X } from 'lucide-react';
import { useEffect, useRef, type FormEvent, type ReactNode } from 'react';
import { Link } from 'react-router';
import { useCustomerSearch } from '@/modules/customers/adapters/ui/hooks/useCustomerSearch';
import type { SearchCustomersUseCase } from '@/modules/customers/application/use-cases/searchCustomers.useCase';
import { useLocale } from '@/shared/i18n/useLocale';
import { StatusMessage } from '@/shared/ui/StatusMessage';

interface SaleCustomerChoiceProps {
  searchCustomers: SearchCustomersUseCase;
  onSelect: (customerId: string) => void;
}

export function SaleCustomerChoice({ searchCustomers, onSelect }: SaleCustomerChoiceProps) {
  const { t } = useLocale();
  const search = useCustomerSearch(searchCustomers);

  function onSearch(event: FormEvent) {
    event.preventDefault();
    void search.submit();
  }

  return (
    <section className="stack customer-choice">
      <div className="row customer-choice-actions">
        <Link className="btn btn-secondary" to="/customers">
          {t('customerCreate')}
        </Link>
      </div>
      <form className="card" onSubmit={onSearch}>
          <label htmlFor="customer-query">{t('findCustomer')}</label>
          <div className="search-row">
            <input
              className="search-field"
              id="customer-query"
              value={search.query}
              placeholder={t('customerSearch')}
              onChange={event => search.setQuery(event.target.value)}
              autoComplete="off"
            />
            <button
              className="btn search-submit"
              type="submit"
              aria-label={search.loading ? t('searching') : t('search')}
              disabled={!search.query.trim() || search.loading}
            >
              <Search aria-hidden="true" strokeWidth={1.8} />
            </button>
          </div>
      </form>
      {search.error && !search.searched ? <StatusMessage tone="error">{t(search.error)}</StatusMessage> : null}
      {search.searched ? (
        <CustomerResults title={t('searchResults')} closeLabel={t('closeSearch')} onClose={search.closeResults}>
          {search.error ? <StatusMessage tone="error">{t(search.error)}</StatusMessage> : null}
          {!search.loading && !search.error && search.customers.length === 0 ? (
            <StatusMessage tone="info">
              {t('customerNoResults')} <Link to="/customers">{t('customerCreate')}</Link>
            </StatusMessage>
          ) : null}
          {search.customers.length > 0 ? (
            <>
              <p className="result-count">{t('customerResultCount').replace('{count}', String(search.customers.length))}</p>
              <ul className="list customer-hits">
                {search.customers.map(customer => (
                  <li key={customer.id}>
                    <button
                      className="customer-hit"
                      type="button"
                      onClick={() => {
                        onSelect(customer.id);
                        search.closeResults();
                      }}
                    >
                      <span className="customer-hit-text">
                        <b>{highlightMatch(customer.name, search.query)}</b>
                        <span className="m">
                          {highlightMatch(`${customer.documentType} ${customer.documentNumber}`, search.query)}
                        </span>
                      </span>
                      <span className="customer-hit-action">{t('chooseCustomer')}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
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
          <X aria-hidden="true" strokeWidth={1.8} />
        </button>
      </div>
      <div className="modal-scroll">{children}</div>
    </dialog>
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

