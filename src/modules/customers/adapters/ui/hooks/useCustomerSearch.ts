import { useEffect, useRef, useState } from 'react';
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
  const queryRef = useRef(query);
  const requestId = useRef(0);
  const refineTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  queryRef.current = query;

  async function submit(next?: string) {
    const term = (next ?? queryRef.current).trim();
    if (next !== undefined) {
      setQuery(next);
    }
    if (!term) {
      if (!searched) {
        setCustomers([]);
        setError('customerSearchRequired');
      }
      return;
    }
    const id = ++requestId.current;
    setCustomers([]);
    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      const found = await searchCustomers.execute(term);
      if (id !== requestId.current) {
        return;
      }
      setCustomers(found);
    } catch (caught) {
      if (id !== requestId.current) {
        return;
      }
      setCustomers([]);
      setError(customerErrorKey(caught, 'customerSearchFailed'));
    } finally {
      if (id === requestId.current) {
        setLoading(false);
      }
    }
  }

  function refine(value: string) {
    setQuery(value);
    if (refineTimer.current) {
      clearTimeout(refineTimer.current);
    }
    refineTimer.current = setTimeout(() => {
      void submit(value);
    }, 250);
  }

  useEffect(() => () => {
    if (refineTimer.current) {
      clearTimeout(refineTimer.current);
    }
  }, []);

  function closeResults() {
    if (refineTimer.current) {
      clearTimeout(refineTimer.current);
    }
    requestId.current += 1;
    setCustomers([]);
    setSearched(false);
    setError(null);
  }

  return { query, setQuery, submit, refine, customers, loading, error, searched, closeResults };
}
