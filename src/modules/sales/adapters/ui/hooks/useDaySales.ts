import { useEffect, useState } from 'react';
import type { GetCurrentSalesDayUseCase } from '@/modules/sales-day/application/use-cases/getCurrentSalesDay.useCase';
import type { ListDaySalesUseCase } from '@/modules/sales/application/use-cases/listDaySales.useCase';
import type { DaySaleModel } from '@/modules/sales/domain/models/daySale';
import type { MessageKey } from '@/shared/i18n/messages';

export function useDaySales(sellerId: string, getCurrentSalesDay: GetCurrentSalesDayUseCase, listDaySales: ListDaySalesUseCase) {
  const [sales, setSales] = useState<DaySaleModel[]>([]);
  const [dayOpen, setDayOpen] = useState(false);
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
    getCurrentSalesDay
      .execute(sellerId)
      .then(async day => {
        if (!day) {
          if (!cancelled) {
            setSales([]);
            setDayOpen(false);
            setError('daySalesMissing');
          }
          return;
        }
        const found = await listDaySales.execute(day.id);
        if (!cancelled) {
          setDayOpen(day.status === 'OPEN');
          setSales(found);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSales([]);
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
  }, [sellerId, getCurrentSalesDay, listDaySales, reloadKey]);

  return { sales, dayOpen, loading, error, reload };
}
