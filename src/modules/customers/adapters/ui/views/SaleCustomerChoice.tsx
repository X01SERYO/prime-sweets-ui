import { useState, type FormEvent } from 'react';
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
    <section className="stack">
      <div className="row">
        <button className="btn" type="button" onClick={() => setMode('search')}>
          {t('findCustomer')}
        </button>
        <Link className="btn btn-secondary" to="/customers">
          {t('customerCreate')}
        </Link>
      </div>
      {mode === 'search' ? (
        <form className="card" onSubmit={onSearch}>
          <p className="m">{t('customerSearchHint')}</p>
          <label htmlFor="customer-query">{t('customerSearch')}</label>
          <div className="row">
            <input
              id="customer-query"
              value={search.query}
              onChange={event => search.setQuery(event.target.value)}
              autoComplete="off"
            />
            <button className="btn" type="submit" disabled={search.loading}>
              {search.loading ? t('searching') : t('search')}
            </button>
          </div>
        </form>
      ) : null}
      {search.error ? <p role="alert">{t(search.error)}</p> : null}
      {search.searched && !search.loading && !search.error && search.customers.length === 0 ? (
        <p className="m">
          {t('customerNoResults')} <Link to="/customers">{t('customerCreate')}</Link>
        </p>
      ) : null}
      {search.customers.length > 0 ? (
        <ul className="list">
          {search.customers.map(customer => (
            <li key={customer.id} className="card">
              <b>{customer.name}</b>
              <span className="m">
                {customer.documentType} {customer.documentNumber}
              </span>
              <button className="btn btn-secondary" type="button" onClick={() => onSelect(customer.id)}>
                {t('chooseCustomer')}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
