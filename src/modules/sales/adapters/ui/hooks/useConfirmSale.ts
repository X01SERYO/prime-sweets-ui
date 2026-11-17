import { useState } from 'react';
import type { ConfirmSaleUseCase } from '@/modules/sales/application/use-cases/confirmSale.useCase';
import { saleErrorKey } from '@/modules/sales/adapters/ui/hooks/saleErrorKey';
import type { SaleModel } from '@/modules/sales/domain/models/sale';
import { canConfirmSale } from '@/modules/sales/domain/saleStatus';
import type { MessageKey } from '@/shared/i18n/messages';

export function useConfirmSale(confirmSale: ConfirmSaleUseCase, onSale: (sale: SaleModel) => void) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<MessageKey | null>(null);

  async function confirm(sale: SaleModel | null): Promise<SaleModel | null> {
    if (!sale || !canConfirmSale(sale.status)) {
      return null;
    }
    setConfirming(true);
    setError(null);
    try {
      const saved = await confirmSale.execute(sale.id, sale.items.length);
      onSale(saved);
      return saved;
    } catch (caught) {
      setError(saleErrorKey(caught, 'saleConfirmFailed'));
      return null;
    } finally {
      setConfirming(false);
    }
  }

  return { confirming, error, confirm };
}
