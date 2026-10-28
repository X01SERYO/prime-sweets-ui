import { useEffect, useState } from 'react';
import type { GetCustomerUseCase } from '@/modules/customers/application/use-cases/getCustomer.useCase';
import { customerErrorKey } from '@/modules/customers/adapters/ui/hooks/customerErrorKey';
import type { CustomerModel } from '@/modules/customers/domain/models/customer';
import type { MessageKey } from '@/shared/i18n/messages';

export function useSaleCustomer(customerId: string | null, getCustomer: GetCustomerUseCase) {
  const [customer, setCustomer] = useState<CustomerModel | null>(null);
  const [error, setError] = useState<MessageKey | null>(null);

  useEffect(() => {
    if (!customerId) {
      setCustomer(null);
      setError(null);
      return;
    }
    let cancelled = false;
    getCustomer
      .execute(customerId)
      .then(found => {
        if (!cancelled) {
          setCustomer(found);
          setError(null);
        }
      })
      .catch((caught: unknown) => {
        if (!cancelled) {
          setCustomer(null);
          setError(customerErrorKey(caught, 'customerLoadFailed'));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [customerId, getCustomer]);

  return { customer, error };
}
