import { useState } from 'react';
import { useSaleCustomer } from '@/modules/customers/adapters/ui/hooks/useSaleCustomer';
import type { GetCustomerUseCase } from '@/modules/customers/application/use-cases/getCustomer.useCase';
import { useLocale } from '@/shared/i18n/useLocale';

interface SelectedCustomerProps {
  customerId: string | null;
  deliveryDate: string | null;
  getCustomer: GetCustomerUseCase;
}

export function SelectedCustomer({ customerId, deliveryDate, getCustomer }: SelectedCustomerProps) {
  const { t, locale } = useLocale();
  const { customer, error } = useSaleCustomer(customerId, getCustomer);
  const [open, setOpen] = useState(false);

  if (!customerId) {
    return null;
  }

  return (
    <section className="card customer-card">
      {error ? <p role="alert">{t(error)}</p> : null}
      {customer ? (
        <>
          <button
            className={open ? 'customer-summary open' : 'customer-summary'}
            type="button"
            aria-expanded={open}
            aria-label={open ? t('hideCustomerDetails') : t('showCustomerDetails')}
            onClick={() => setOpen(current => !current)}
          >
            <span className="customer-text">
              <span className="customer-kicker">{t('saleCustomer')}</span>
              <span className="customer-name">{customer.name}</span>
            </span>
            <ChevronIcon />
          </button>
          {open ? (
            <dl className="customer-details">
              {deliveryDate ? (
                <>
                  <dt>{t('deliveryDay')}</dt>
                  <dd>{formatDeliveryHeading(deliveryDate, locale)}</dd>
                </>
              ) : null}
              <dt>{t('documentType')}</dt>
              <dd>{customer.documentType}</dd>
              <dt>{t('documentNumber')}</dt>
              <dd>{customer.documentNumber}</dd>
              {customer.phone ? (
                <>
                  <dt>{t('phone')}</dt>
                  <dd>{customer.phone}</dd>
                </>
              ) : null}
              {customer.email ? (
                <>
                  <dt>{t('email')}</dt>
                  <dd>{customer.email}</dd>
                </>
              ) : null}
              {customer.address ? (
                <>
                  <dt>{t('address')}</dt>
                  <dd>{customer.address}</dd>
                </>
              ) : null}
            </dl>
          ) : null}
        </>
      ) : (
        <p className="m">…</p>
      )}
    </section>
  );
}

function formatDeliveryHeading(value: string, locale: string): string {
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) {
    return value;
  }
  const language = locale === 'en' ? 'en-US' : 'es-CO';
  const formatted = new Intl.DateTimeFormat(language, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC'
  }).format(new Date(Date.UTC(year, month - 1, day)));
  const cleaned = formatted.replace(',', '');
  return cleaned.charAt(0).toLocaleUpperCase(language) + cleaned.slice(1);
}

function ChevronIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M7.4 8.6 12 13.2l4.6-4.6L18 10l-6 6-6-6z" />
    </svg>
  );
}
