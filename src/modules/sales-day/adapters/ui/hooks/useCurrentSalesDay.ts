import { useEffect, useState } from 'react';
import type { GetCurrentSalesDayUseCase } from '@/modules/sales-day/application/use-cases/getCurrentSalesDay.useCase';
import type { SalesDayModel } from '@/modules/sales-day/domain/models/salesDay';
import type { MessageKey } from '@/shared/i18n/messages';
import { salesDayErrorKey } from '@/modules/sales-day/adapters/ui/hooks/salesDayErrorKey';

interface LoadState {
  sellerId: string;
  salesDay: SalesDayModel | null;
  errorKey: MessageKey | null;
  settled: boolean;
}

export function useCurrentSalesDay(sellerId: string, getCurrentSalesDay: GetCurrentSalesDayUseCase) {
  const [state, setState] = useState<LoadState>({
    sellerId,
    salesDay: null,
    errorKey: null,
    settled: false
  });

  if (state.sellerId !== sellerId) {
    setState({ sellerId, salesDay: null, errorKey: null, settled: false });
  }

  useEffect(() => {
    let active = true;
    void getCurrentSalesDay
      .execute(sellerId)
      .then(day => {
        if (active) {
          setState({ sellerId, salesDay: day, errorKey: null, settled: true });
        }
      })
      .catch(caught => {
        if (active) {
          setState({
            sellerId,
            salesDay: null,
            errorKey: salesDayErrorKey(caught, 'salesDayFailed'),
            settled: true
          });
        }
      });
    return () => {
      active = false;
    };
  }, [sellerId, getCurrentSalesDay]);

  const current =
    state.sellerId === sellerId ? state : { sellerId, salesDay: null, errorKey: null, settled: false };

  function show(day: SalesDayModel) {
    setState({ sellerId, salesDay: day, errorKey: null, settled: true });
  }

  return {
    salesDay: current.salesDay,
    loading: !current.settled,
    errorKey: current.errorKey,
    show
  };
}
