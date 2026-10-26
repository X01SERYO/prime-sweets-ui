import { useState } from 'react';
import type { OpenSalesDayUseCase } from '@/modules/sales-day/application/use-cases/openSalesDay.useCase';
import type { SalesDayModel } from '@/modules/sales-day/domain/models/salesDay';
import type { MessageKey } from '@/shared/i18n/messages';
import { salesDayErrorKey } from '@/modules/sales-day/adapters/ui/hooks/salesDayErrorKey';

export function useOpenSalesDay(sellerId: string, openSalesDay: OpenSalesDayUseCase) {
  const [opening, setOpening] = useState(false);
  const [errorKey, setErrorKey] = useState<MessageKey | null>(null);

  async function open(): Promise<SalesDayModel | null> {
    setOpening(true);
    setErrorKey(null);
    try {
      return await openSalesDay.execute(sellerId);
    } catch (caught) {
      setErrorKey(salesDayErrorKey(caught, 'salesDayOpenFailed'));
      return null;
    } finally {
      setOpening(false);
    }
  }

  return { opening, errorKey, open };
}
