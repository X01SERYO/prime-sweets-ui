import { useState } from 'react';
import type { VoidSaleUseCase } from '@/modules/sales/application/use-cases/voidSale.useCase';
import { saleErrorKey } from '@/modules/sales/adapters/ui/hooks/saleErrorKey';
import type { SaleModel } from '@/modules/sales/domain/models/sale';
import type { MessageKey } from '@/shared/i18n/messages';

export function useVoidSale(voidSale: VoidSaleUseCase, onSale: (sale: SaleModel) => void) {
  const [voiding, setVoiding] = useState(false);
  const [error, setError] = useState<MessageKey | null>(null);

  async function voidConfirmed(sale: SaleModel | null) {
    if (!sale || sale.status !== 'CONFIRMED') {
      return;
    }
    setVoiding(true);
    setError(null);
    try {
      onSale(await voidSale.execute(sale.id));
    } catch (caught) {
      setError(saleErrorKey(caught, 'saleVoidFailed'));
    } finally {
      setVoiding(false);
    }
  }

  return { voiding, error, voidConfirmed };
}
