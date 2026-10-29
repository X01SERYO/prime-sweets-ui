import { useEffect, useState } from 'react';
import type { ListInvoicesUseCase } from '@/modules/fulfillment-output/application/use-cases/listInvoices.useCase';
import { invoiceErrorKey } from '@/modules/fulfillment-output/adapters/ui/hooks/invoiceErrorKey';
import type { InvoiceSummaryModel } from '@/modules/fulfillment-output/domain/models/invoiceSummary';
import type { MessageKey } from '@/shared/i18n/messages';

export function useInvoices(salesDayId: string | undefined, listInvoices: ListInvoicesUseCase) {
  const [invoices, setInvoices] = useState<InvoiceSummaryModel[]>([]);
  const [loading, setLoading] = useState(Boolean(salesDayId));
  const [error, setError] = useState<MessageKey | null>(null);

  useEffect(() => {
    if (!salesDayId) {
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    listInvoices
      .execute(salesDayId)
      .then(found => {
        if (!cancelled) {
          setInvoices(found);
        }
      })
      .catch((caught: unknown) => {
        if (!cancelled) {
          setInvoices([]);
          setError(invoiceErrorKey(caught, 'invoiceListFailed'));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [salesDayId, listInvoices]);

  if (!salesDayId) {
    return { invoices: [], loading: false, error: 'invoiceMissingDay' as MessageKey };
  }

  return { invoices, loading, error };
}
