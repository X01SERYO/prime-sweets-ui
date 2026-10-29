import { useState } from 'react';
import type { CloseSalesDayUseCase } from '@/modules/sales-day/application/use-cases/closeSalesDay.useCase';
import { salesDayErrorKey } from '@/modules/sales-day/adapters/ui/hooks/salesDayErrorKey';
import type { SalesDayModel } from '@/modules/sales-day/domain/models/salesDay';
import type { MessageKey } from '@/shared/i18n/messages';

export function useCloseSalesDay(closeSalesDay: CloseSalesDayUseCase) {
  const [closing, setClosing] = useState(false);
  const [errorKey, setErrorKey] = useState<MessageKey | null>(null);

  async function close(salesDayId: string): Promise<SalesDayModel | null> {
    setClosing(true);
    setErrorKey(null);
    try {
      return await closeSalesDay.execute(salesDayId);
    } catch (caught) {
      setErrorKey(salesDayErrorKey(caught, 'salesDayCloseFailed'));
      return null;
    } finally {
      setClosing(false);
    }
  }

  return { closing, errorKey, close };
}
