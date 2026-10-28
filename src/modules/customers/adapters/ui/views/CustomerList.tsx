import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { useCreateCustomer } from '@/modules/customers/adapters/ui/hooks/useCreateCustomer';
import { useCustomerSearch } from '@/modules/customers/adapters/ui/hooks/useCustomerSearch';
import type { CreateCustomerUseCase } from '@/modules/customers/application/use-cases/createCustomer.useCase';
import type { SearchCustomersUseCase } from '@/modules/customers/application/use-cases/searchCustomers.useCase';
import { useLocale } from '@/shared/i18n/useLocale';

const documentTypes = ['CC', 'NIT', 'CE', 'TI', 'PA'] as const;

interface CustomerListProps {
  searchCustomers: SearchCustomersUseCase;
  createCustomer: CreateCustomerUseCase;
}

export function CustomerList({ searchCustomers, createCustomer }: CustomerListProps) {
  const { t } = useLocale();
  const navigate = useNavigate();
  const search = useCustomerSearch(searchCustomers);
  const form = useCreateCustomer(createCustomer);
  const [showExtra, setShowExtra] = useState(false);

  function openSale(customerId: string) {
    navigate(`/sales?customerId=${encodeURIComponent(customerId)}`);
  }

  function onSearch(event: FormEvent) {
    event.preventDefault();
    void search.submit();
  }

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    const created = await form.submit();
    if (created) {
      openSale(created.id);
    }
  }

  return (
    <section className="stack">
      <h1>{t('customers')}</h1>
      <p className="m">{t('customerSearchHint')}</p>
      <form className="card" onSubmit={onSearch}>
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
      {search.error ? <p role="alert">{t(search.error)}</p> : null}
      {search.searched && !search.loading && !search.error && search.customers.length === 0 ? (
        <p className="m">{t('customerNoResults')}</p>
      ) : null}
      {search.customers.length > 0 ? (
        <ul className="list">
          {search.customers.map(customer => (
            <li key={customer.id} className="card">
              <b>{customer.name}</b>
              <span className="m">
                {customer.documentType} {customer.documentNumber}
              </span>
              <button className="btn btn-secondary" type="button" onClick={() => openSale(customer.id)}>
                {t('chooseCustomer')}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <form className="card" onSubmit={event => void onCreate(event)}>
        <h2>{t('customerCreate')}</h2>
        <label htmlFor="document-type">{t('documentType')}</label>
        <select id="document-type" value={form.documentType} onChange={event => form.setDocumentType(event.target.value)}>
          {documentTypes.map(type => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
        <label htmlFor="document-number">{t('documentNumber')}</label>
        <input
          id="document-number"
          value={form.documentNumber}
          onChange={event => form.setDocumentNumber(event.target.value)}
          autoComplete="off"
        />
        <label htmlFor="customer-name">{t('customerName')}</label>
        <input id="customer-name" value={form.name} onChange={event => form.setName(event.target.value)} autoComplete="name" />
        <button className="btn btn-secondary" type="button" onClick={() => setShowExtra(current => !current)}>
          {t('extraInvoicing')}
        </button>
        {showExtra ? (
          <>
            <label htmlFor="customer-phone">{t('phone')}</label>
            <input id="customer-phone" value={form.phone} onChange={event => form.setPhone(event.target.value)} autoComplete="tel" />
            <label htmlFor="customer-email">{t('email')}</label>
            <input
              id="customer-email"
              type="email"
              value={form.email}
              onChange={event => form.setEmail(event.target.value)}
              autoComplete="email"
            />
            <label htmlFor="customer-address">{t('address')}</label>
            <input id="customer-address" value={form.address} onChange={event => form.setAddress(event.target.value)} />
          </>
        ) : null}
        {form.error ? <p role="alert">{t(form.error)}</p> : null}
        <button className="btn" type="submit" disabled={form.saving}>
          {t('customerCreate')}
        </button>
      </form>
    </section>
  );
}
