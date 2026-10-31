import { useEffect, useState } from 'react';
import type { ListSalesByDeliveryDateUseCase } from '@/modules/sales/application/use-cases/listSalesByDeliveryDate.useCase';
import type { DaySaleModel } from '@/modules/sales/domain/models/daySale';
import type { MessageKey } from '@/shared/i18n/messages';

export function useDeliverySales(deliveryDate: string | undefined, listSales: ListSalesByDeliveryDateUseCase | undefined) {
  const [sales, setSales] = useState<DaySaleModel[]>([]);
  const [loading, setLoading] = useState(Boolean(deliveryDate));
  const [error, setError] = useState<MessageKey | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  function reload() {
    setReloadKey(current => current + 1);
  }

  useEffect(() => {
    if (!deliveryDate || !listSales) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    listSales
      .execute(deliveryDate)
      .then(found => {
        if (!cancelled) {
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
  }, [deliveryDate, listSales, reloadKey]);

  return { sales, loading, error, reload };
}
