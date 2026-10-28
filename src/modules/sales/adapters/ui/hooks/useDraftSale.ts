import { useEffect, useState } from 'react';
import type { CreateDraftSaleUseCase } from '@/modules/sales/application/use-cases/createDraftSale.useCase';
import type { ListDraftSalesUseCase } from '@/modules/sales/application/use-cases/listDraftSales.useCase';
import { saleErrorKey } from '@/modules/sales/adapters/ui/hooks/saleErrorKey';
import type { SaleModel } from '@/modules/sales/domain/models/sale';
import type { GetCurrentSalesDayUseCase } from '@/modules/sales-day/application/use-cases/getCurrentSalesDay.useCase';
import type { MessageKey } from '@/shared/i18n/messages';

export function useDraftSale(
  sellerId: string,
  customerId: string | null,
  getCurrentSalesDay: GetCurrentSalesDayUseCase,
  listDrafts: ListDraftSalesUseCase,
  createDraft: CreateDraftSaleUseCase
) {
  const [sale, setSale] = useState<SaleModel | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<MessageKey | null>(null);

  useEffect(() => {
    if (!customerId) {
      setSale(null);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    getCurrentSalesDay
      .execute(sellerId)
      .then(async day => {
        if (!day) {
          if (!cancelled) {
            setError('saleDayMissing');
            setSale(null);
          }
          return null;
        }
        if (day.status !== 'OPEN') {
          if (!cancelled) {
            setError('saleDayClosed');
          }
          return null;
        }
        const drafts = await listDrafts.execute(day.id, customerId);
        if (drafts[0]) {
          return drafts[0];
        }
        return createDraft.execute(day.id, customerId);
      })
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
  }, [sellerId, customerId, getCurrentSalesDay, listDrafts, createDraft]);

  return { sale, setSale, loading, error };
}
