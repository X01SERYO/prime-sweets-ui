import { useState } from 'react';
import type { ConfirmSaleUseCase } from '@/modules/sales/application/use-cases/confirmSale.useCase';
import { saleErrorKey } from '@/modules/sales/adapters/ui/hooks/saleErrorKey';
import type { SaleModel } from '@/modules/sales/domain/models/sale';
import type { MessageKey } from '@/shared/i18n/messages';

export function useConfirmSale(confirmSale: ConfirmSaleUseCase, onSale: (sale: SaleModel) => void) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<MessageKey | null>(null);

  async function confirm(sale: SaleModel | null) {
    if (!sale || sale.status !== 'DRAFT') {
      return;
    }
    setConfirming(true);
    setError(null);
    try {
      onSale(await confirmSale.execute(sale.id, sale.items.length));
    } catch (caught) {
      setError(saleErrorKey(caught, 'saleConfirmFailed'));
    } finally {
      setConfirming(false);
    }
  }

  return { confirming, error, confirm };
}
