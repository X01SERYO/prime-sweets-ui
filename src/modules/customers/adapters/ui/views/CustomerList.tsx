import { useCustomerList } from '@/modules/customers/adapters/ui/hooks/useCustomerList';
import { listCustomers } from '@/modules/customers/customers.composition';
import { useLocale } from '@/shared/i18n/useLocale';

export function CustomerList() {
  const { t } = useLocale();
  const customers = useCustomerList(listCustomers);
  return (
    <section className="stack">
      <h1>{t('customers')}</h1>
      <p className="m">{t('dummyNotice')}</p>
      <ul className="list">
        {customers.map(customer => (
          <li key={customer.id} className="card">
            <b>{customer.name}</b>
            <span className="m">{customer.document}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
