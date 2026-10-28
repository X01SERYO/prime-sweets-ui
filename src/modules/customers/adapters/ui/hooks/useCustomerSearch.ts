import { useState } from 'react';
import type { SearchCustomersUseCase } from '@/modules/customers/application/use-cases/searchCustomers.useCase';
import { customerErrorKey } from '@/modules/customers/adapters/ui/hooks/customerErrorKey';
import type { CustomerModel } from '@/modules/customers/domain/models/customer';
import type { MessageKey } from '@/shared/i18n/messages';

export function useCustomerSearch(searchCustomers: SearchCustomersUseCase) {
  const [query, setQuery] = useState('');
  const [customers, setCustomers] = useState<CustomerModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<MessageKey | null>(null);
  const [searched, setSearched] = useState(false);

  async function submit() {
    if (!query.trim()) {
      setCustomers([]);
      setSearched(false);
      setError('customerSearchRequired');
      return;
    }
    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      setCustomers(await searchCustomers.execute(query));
    } catch (caught) {
      setCustomers([]);
      setError(customerErrorKey(caught, 'customerSearchFailed'));
    } finally {
      setLoading(false);
    }
  }

  return { query, setQuery, submit, customers, loading, error, searched };
}
