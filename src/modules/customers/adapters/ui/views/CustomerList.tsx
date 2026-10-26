import { useLocale } from '@/shared/i18n/useLocale';

const customers = [
  { id: 'c1', name: 'Tienda Doña Rosa', document: 'CC 52123456' },
  { id: 'c2', name: 'Minimercado El Vecino', document: 'NIT 900123456' },
  { id: 'c3', name: 'Supertienda La 80', document: 'CC 43890123' }
];

export function CustomerList() {
  const { t } = useLocale();
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
