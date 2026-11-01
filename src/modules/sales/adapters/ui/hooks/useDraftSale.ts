import { useEffect, useState } from 'react';
import type { CreateDraftSaleUseCase } from '@/modules/sales/application/use-cases/createDraftSale.useCase';
import type { GetSaleUseCase } from '@/modules/sales/application/use-cases/getSale.useCase';
import type { ListDraftSalesUseCase } from '@/modules/sales/application/use-cases/listDraftSales.useCase';
import { saleErrorKey } from '@/modules/sales/adapters/ui/hooks/saleErrorKey';
import type { SaleModel } from '@/modules/sales/domain/models/sale';
import type { MessageKey } from '@/shared/i18n/messages';

export function useDraftSale(
  customerId: string | null,
  saleId: string | null,
  deliveryDate: string | null,
  listDrafts: ListDraftSalesUseCase,
  createDraft: CreateDraftSaleUseCase,
  getSale: GetSaleUseCase
) {
  const [sale, setSale] = useState<SaleModel | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<MessageKey | null>(null);

  useEffect(() => {
    if (!customerId && !saleId) {
      setSale(null);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    const load = saleId
      ? getSale.execute(saleId)
      : customerId && deliveryDate
        ? listDrafts.execute(deliveryDate, customerId).then(async drafts => {
            return drafts[0] ?? createDraft.execute(customerId, deliveryDate);
          })
        : Promise.resolve(null);
    load
      .then(draft => {
        if (!cancelled && draft) {
          setSale(draft);
        }
      })
      .catch((caught: unknown) => {
        if (!cancelled) {
          setSale(null);
          setError(saleErrorKey(caught, 'saleLoadFailed'));
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
  }, [customerId, saleId, deliveryDate, listDrafts, createDraft, getSale]);

  return { sale, setSale, loading, error };
}
