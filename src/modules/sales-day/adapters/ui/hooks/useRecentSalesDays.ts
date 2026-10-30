import { useEffect, useState } from 'react';
import { salesDayErrorKey } from '@/modules/sales-day/adapters/ui/hooks/salesDayErrorKey';
import type { ListRecentSalesDaysUseCase } from '@/modules/sales-day/application/use-cases/listRecentSalesDays.useCase';
import type { SalesDayModel } from '@/modules/sales-day/domain/models/salesDay';
import type { MessageKey } from '@/shared/i18n/messages';

export function useRecentSalesDays(sellerId: string, listRecentSalesDays: ListRecentSalesDaysUseCase) {
  const [days, setDays] = useState<SalesDayModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorKey, setErrorKey] = useState<MessageKey | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  function reload() {
    setReloadKey(current => current + 1);
  }

  useEffect(() => {
    let active = true;
    setLoading(true);
    setErrorKey(null);
    void listRecentSalesDays
      .execute(sellerId)
      .then(found => {
        if (active) {
          setDays(found);
        }
      })
      .catch(caught => {
        if (active) {
          setDays([]);
          setErrorKey(salesDayErrorKey(caught, 'recentSalesDaysFailed'));
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [sellerId, listRecentSalesDays, reloadKey]);

  return { days, loading, errorKey, reload };
}
