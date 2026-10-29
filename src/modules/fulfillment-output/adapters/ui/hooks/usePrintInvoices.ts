import { useState } from 'react';
import type { PrintInvoicesUseCase } from '@/modules/fulfillment-output/application/use-cases/printInvoices.useCase';
import { invoiceErrorKey } from '@/modules/fulfillment-output/adapters/ui/hooks/invoiceErrorKey';
import type { MessageKey } from '@/shared/i18n/messages';

export function usePrintInvoices(printInvoices: PrintInvoicesUseCase) {
  const [printing, setPrinting] = useState(false);
  const [error, setError] = useState<MessageKey | null>(null);

  async function print(saleIds: string[]) {
    if (saleIds.length === 0) {
      setError('invoiceSelectionRequired');
      return;
    }
    setPrinting(true);
    setError(null);
    try {
      await printInvoices.execute(saleIds);
    } catch (caught) {
      setError(invoiceErrorKey(caught, 'invoicePrintFailed'));
    } finally {
      setPrinting(false);
    }
  }

  return { printing, error, print };
}
