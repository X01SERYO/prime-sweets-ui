import { useState } from 'react';
import { useSaleCustomer } from '@/modules/customers/adapters/ui/hooks/useSaleCustomer';
import type { GetCustomerUseCase } from '@/modules/customers/application/use-cases/getCustomer.useCase';
import { useLocale } from '@/shared/i18n/useLocale';

interface SelectedCustomerProps {
  customerId: string | null;
  getCustomer: GetCustomerUseCase;
}

export function SelectedCustomer({ customerId, getCustomer }: SelectedCustomerProps) {
  const { t } = useLocale();
  const { customer, error } = useSaleCustomer(customerId, getCustomer);
  const [open, setOpen] = useState(false);

  if (!customerId) {
    return null;
  }

  return (
    <section className="card">
      <h2>{t('saleCustomer')}</h2>
      {error ? <p role="alert">{t(error)}</p> : null}
      {customer ? (
        <>
          <div className="customer-summary">
            <p className="customer-name">{customer.name}</p>
            <button
              className={open ? 'customer-toggle open' : 'customer-toggle'}
              type="button"
              aria-expanded={open}
              aria-label={open ? t('hideCustomerDetails') : t('showCustomerDetails')}
              onClick={() => setOpen(current => !current)}
            >
              <ChevronIcon />
            </button>
          </div>
          {open ? (
            <table className="info">
              <tbody>
                <tr>
                  <th scope="row">{t('documentType')}</th>
                  <td>{customer.documentType}</td>
                </tr>
                <tr>
                  <th scope="row">{t('documentNumber')}</th>
                  <td>{customer.documentNumber}</td>
                </tr>
                {customer.phone ? (
                  <tr>
                    <th scope="row">{t('phone')}</th>
                    <td>{customer.phone}</td>
                  </tr>
                ) : null}
                {customer.email ? (
                  <tr>
                    <th scope="row">{t('email')}</th>
                    <td>{customer.email}</td>
                  </tr>
                ) : null}
                {customer.address ? (
                  <tr>
                    <th scope="row">{t('address')}</th>
                    <td>{customer.address}</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          ) : null}
        </>
      ) : (
        <p className="m">…</p>
      )}
    </section>
  );
}

function ChevronIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M7.4 8.6 12 13.2l4.6-4.6L18 10l-6 6-6-6z" />
    </svg>
  );
}
