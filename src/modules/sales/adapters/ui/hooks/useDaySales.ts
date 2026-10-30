import { useEffect, useState } from 'react';
import type { GetCurrentSalesDayUseCase } from '@/modules/sales-day/application/use-cases/getCurrentSalesDay.useCase';
import type { ListDaySalesUseCase } from '@/modules/sales/application/use-cases/listDaySales.useCase';
import type { DaySaleModel } from '@/modules/sales/domain/models/daySale';
import type { MessageKey } from '@/shared/i18n/messages';

export function useDaySales(
  sellerId: string,
  salesDayId: string | undefined,
  getCurrentSalesDay: GetCurrentSalesDayUseCase,
  listDaySales: ListDaySalesUseCase
) {
  const [sales, setSales] = useState<DaySaleModel[]>([]);
  const [dayOpen, setDayOpen] = useState(false);
  const [dayId, setDayId] = useState<string | null>(salesDayId ?? null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<MessageKey | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  function reload() {
    setReloadKey(current => current + 1);
  }

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const listed = salesDayId
      ? listDaySales.execute(salesDayId).then(found => ({ found, dayOpen: false, dayId: salesDayId, missing: false }))
      : getCurrentSalesDay.execute(sellerId).then(async day => {
          if (!day) {
            return { found: [] as DaySaleModel[], dayOpen: false, dayId: null, missing: true };
          }
          const found = await listDaySales.execute(day.id);
          return { found, dayOpen: day.status === 'OPEN', dayId: day.id, missing: false };
        });
    listed
      .then(result => {
        if (!cancelled) {
          setSales(result.found);
          setDayOpen(result.dayOpen);
          setDayId(result.dayId);
          setError(result.missing ? 'daySalesMissing' : null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSales([]);
          setDayOpen(false);
          setDayId(salesDayId ?? null);
          setError('daySalesFailed');
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
  }, [sellerId, salesDayId, getCurrentSalesDay, listDaySales, reloadKey]);

  return { sales, dayOpen, dayId, loading, error, reload };
}
