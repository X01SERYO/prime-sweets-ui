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

  if (!customerId) {
    return null;
  }

  return (
    <section className="card">
      <h2>{t('saleCustomer')}</h2>
      {error ? <p role="alert">{t(error)}</p> : null}
      {customer ? (
        <table className="info">
          <tbody>
            <tr>
              <th scope="row">{t('customerName')}</th>
              <td>{customer.name}</td>
            </tr>
            <tr>
              <th scope="row">{t('documentType')}</th>
              <td>{customer.documentType}</td>
            </tr>
            <tr>
              <th scope="row">{t('documentNumber')}</th>
              <td>{customer.documentNumber}</td>
            </tr>
          </tbody>
        </table>
      ) : (
        <p className="m">…</p>
      )}
    </section>
  );
}
