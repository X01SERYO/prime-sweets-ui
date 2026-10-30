import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { useCreateCustomer } from '@/modules/customers/adapters/ui/hooks/useCreateCustomer';
import type { CreateCustomerUseCase } from '@/modules/customers/application/use-cases/createCustomer.useCase';
import { useLocale } from '@/shared/i18n/useLocale';
import { ScreenTitle } from '@/shared/ui/BackButton';

const documentTypes = ['CC', 'NIT', 'CE', 'TI', 'PA'] as const;

interface CustomerListProps {
  createCustomer: CreateCustomerUseCase;
}

export function CustomerList({ createCustomer }: CustomerListProps) {
  const { t } = useLocale();
  const navigate = useNavigate();
  const form = useCreateCustomer(createCustomer);
  const [showExtra, setShowExtra] = useState(false);

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    const created = await form.submit();
    if (created) {
      navigate('/sales');
    }
  }

  return (
    <section className="stack">
      <ScreenTitle>{t('customerCreate')}</ScreenTitle>
      <form className="card" onSubmit={event => void onCreate(event)}>
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
