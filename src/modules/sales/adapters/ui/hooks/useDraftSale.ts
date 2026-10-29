import { useEffect, useState } from 'react';
import type { CreateDraftSaleUseCase } from '@/modules/sales/application/use-cases/createDraftSale.useCase';
import type { GetSaleUseCase } from '@/modules/sales/application/use-cases/getSale.useCase';
import type { ListDraftSalesUseCase } from '@/modules/sales/application/use-cases/listDraftSales.useCase';
import { saleErrorKey } from '@/modules/sales/adapters/ui/hooks/saleErrorKey';
import type { SaleModel } from '@/modules/sales/domain/models/sale';
import type { GetCurrentSalesDayUseCase } from '@/modules/sales-day/application/use-cases/getCurrentSalesDay.useCase';
import type { MessageKey } from '@/shared/i18n/messages';

export function useDraftSale(
  sellerId: string,
  customerId: string | null,
  saleId: string | null,
  getCurrentSalesDay: GetCurrentSalesDayUseCase,
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
        if (saleId) {
          return getSale.execute(saleId);
        }
        if (!customerId) {
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
  }, [sellerId, customerId, saleId, getCurrentSalesDay, listDrafts, createDraft, getSale]);

  return { sale, setSale, loading, error };
}
