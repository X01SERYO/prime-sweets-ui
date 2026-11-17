import { Check, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { CustomerFormDialog } from '@/modules/customers/adapters/ui/views/CustomerFormDialog';
import { useSaleCustomer } from '@/modules/customers/adapters/ui/hooks/useSaleCustomer';
import type { GetCustomerUseCase } from '@/modules/customers/application/use-cases/getCustomer.useCase';
import type { UpdateCustomerUseCase } from '@/modules/customers/application/use-cases/updateCustomer.useCase';
import type { CustomerModel } from '@/modules/customers/domain/models/customer';
import { useLocale } from '@/shared/i18n/useLocale';
import { StatusMessage } from '@/shared/ui/StatusMessage';

interface SelectedCustomerProps {
  customerId: string | null;
  getCustomer: GetCustomerUseCase;
  updateCustomer: UpdateCustomerUseCase;
  onChange: () => void;
}

export function SelectedCustomer({ customerId, getCustomer, updateCustomer, onChange }: SelectedCustomerProps) {
  const { t } = useLocale();
  const { customer, error, replace } = useSaleCustomer(customerId, getCustomer);
  const [editing, setEditing] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [customerId]);

  if (!customerId) {
    return null;
  }

  function onSaved(saved: CustomerModel) {
    replace(saved);
    setEditing(false);
  }

  return (
    <section className="card customer-card">
      {error ? <StatusMessage tone="error">{t(error)}</StatusMessage> : null}
      {customer ? (
        <>
          <div className="customer-main">
            <span className="customer-kicker">
              <span className="step-num is-ok" aria-hidden="true">
                <Check strokeWidth={2.2} />
              </span>
              {t('saleCustomer')}
              <button
                className={open ? 'customer-fold open' : 'customer-fold'}
                type="button"
                aria-expanded={open}
                aria-label={open ? t('hideCustomerDetails') : t('showCustomerDetails')}
                onClick={() => setOpen(current => !current)}
              >
                <ChevronRight aria-hidden="true" strokeWidth={1.8} />
              </button>
            </span>
            <h2 className="customer-name">{customer.name}</h2>
            <p className="customer-doc">{customer.documentType} {customer.documentNumber}</p>
            {open ? (
              <dl className="customer-details">
                <dt>{t('phone')}</dt>
                <dd>{customer.phone || '—'}</dd>
                <dt>{t('email')}</dt>
                <dd>{customer.email || '—'}</dd>
                <dt>{t('address')}</dt>
                <dd>{customer.address || '—'}</dd>
              </dl>
            ) : null}
          </div>
          <div className="customer-actions">
            <button className="btn btn-secondary" type="button" onClick={() => setEditing(true)}>{t('customerEdit')}</button>
            <button className="btn btn-secondary" type="button" onClick={onChange}>{t('customerChange')}</button>
          </div>
          {editing ? (
            <CustomerFormDialog
              customer={customer}
              updateCustomer={updateCustomer}
              onClose={() => setEditing(false)}
              onSaved={onSaved}
            />
          ) : null}
        </>
      ) : (
        <p className="m">…</p>
      )}
    </section>
  );
}
