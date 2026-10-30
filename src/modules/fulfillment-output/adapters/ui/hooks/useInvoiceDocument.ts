import { useEffect, useState } from 'react';
import type { GenerateInvoiceUseCase } from '@/modules/fulfillment-output/application/use-cases/generateInvoice.useCase';
import { invoiceErrorKey, invoiceErrorKind } from '@/modules/fulfillment-output/adapters/ui/hooks/invoiceErrorKey';
import type { InvoiceDocumentModel } from '@/modules/fulfillment-output/domain/models/invoiceSummary';
import type { MessageKey } from '@/shared/i18n/messages';

export function useInvoiceDocument(saleId: string | undefined, generateInvoice: GenerateInvoiceUseCase) {
  const [document, setDocument] = useState<InvoiceDocumentModel | null>(null);
  const [loading, setLoading] = useState(Boolean(saleId));
  const [error, setError] = useState<MessageKey | null>(null);
  const [errorKind, setErrorKind] = useState<'business' | 'technical' | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!saleId) {
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    setErrorKind(null);
    generateInvoice
      .execute(saleId)
      .then(found => {
        if (!cancelled) {
          setDocument(found);
        }
      })
      .catch((caught: unknown) => {
        if (!cancelled) {
          setDocument(null);
          setError(invoiceErrorKey(caught, 'invoiceLoadFailed'));
          setErrorKind(invoiceErrorKind(caught));
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
  }, [saleId, generateInvoice, attempt]);

  return { document, loading, error, errorKind, retry: () => setAttempt(current => current + 1) };
}
