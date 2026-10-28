import { Link } from 'react-router';
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
    return (
      <p className="m">
        {t('saleNeedsCustomer')} <Link to="/customers">{t('customers')}</Link>
      </p>
    );
  }

  return (
    <p className="m">
      {t('saleCustomer')}
      {': '}
      {error ? t(error) : customer ? `${customer.name} · ${customer.documentType} ${customer.documentNumber}` : '…'}
    </p>
  );
}
