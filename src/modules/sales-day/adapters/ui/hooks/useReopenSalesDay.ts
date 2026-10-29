import { useState } from 'react';
import type { ReopenSalesDayUseCase } from '@/modules/sales-day/application/use-cases/reopenSalesDay.useCase';
import { salesDayErrorKey } from '@/modules/sales-day/adapters/ui/hooks/salesDayErrorKey';
import type { SalesDayModel } from '@/modules/sales-day/domain/models/salesDay';
import type { MessageKey } from '@/shared/i18n/messages';

export function useReopenSalesDay(reopenSalesDay: ReopenSalesDayUseCase) {
  const [reopening, setReopening] = useState(false);
  const [errorKey, setErrorKey] = useState<MessageKey | null>(null);

  async function reopen(salesDayId: string): Promise<SalesDayModel | null> {
    setReopening(true);
    setErrorKey(null);
    try {
      return await reopenSalesDay.execute(salesDayId);
    } catch (caught) {
      setErrorKey(salesDayErrorKey(caught, 'salesDayReopenFailed'));
      return null;
    } finally {
      setReopening(false);
    }
  }

  return { reopening, errorKey, reopen };
}
